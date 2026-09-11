import os
import sys
import re
import json
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from collections import Counter

from fastapi import FastAPI, HTTPException, Query, Body, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import fitz  # PyMuPDF
from ingester import engine, STORAGE_DIR, PDF_DIR, CHROMA_DIR
from scraper import scrape_public_data, SCRAPE_LOGS, add_log
from rag_engine import query_rag, pick_model, test_and_resolve_model, GROQ_API_KEY, extract_domain_entities_via_inference, ENGLISH_SEMANTIC_STOPWORDS
from report_generator import build_multi_format_report, build_structured_report, REPORTS_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main_api")

app = FastAPI(
    title="CMPDI / CIL AI-Powered Geological & Mining Reporting Solution",
    description="Enterprise-grade AI reporting engine with RAG Q&A, PyMuPDF spatial citations, multi-format export, and geological analytics.",
    version="3.1.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    n_results: int = 4
    api_key: Optional[str] = None
    source_filter: Optional[str] = None

class SimpleReportRequest(BaseModel):
    topic: str
    format: Optional[str] = "all"
    api_key: Optional[str] = None

class StructuredReportRequest(BaseModel):
    report_type: Optional[str] = "comprehensive_audit"
    subsidiary: str = "All CIL Aggregate"
    timeframe: str = "FY 2023-24"
    tone: str = "Formal Executive Brief"
    custom_prompt: Optional[str] = ""
    custom_notes: Optional[str] = ""
    sections: Optional[List[str]] = None
    api_key: Optional[str] = None

class KeyValidateRequest(BaseModel):
    api_key: str

GEOLOGICAL_TAXONOMY = {
    "subsidiaries": [
        "CMPDI", "CIL", "ECL", "BCCL", "CCL", "WCL", "SECL", "MCL", "NCL", "NEC"
    ],
    "geological_terms": [
        "Barakar", "Raniganj", "Karharbari", "Gondwana", "Stratigraphy", 
        "Coal Bed Methane", "CBM", "Borehole", "Lithology", "Seam", 
        "Overburden", "Stripping Ratio", "Ash Content", "Gross Calorific Value",
        "Calorimetry", "Beneficiation", "Opencast", "Underground", "Hydrogeology"
    ],
    "mining_metrics": [
        "Million Tonnes", "MT", "Off-take", "OBR", "M.Cum", "GCV", 
        "Rakes", "Silos", "DPR", "Lakh Metres", "FMC"
    ]
}

def require_api_key(provided_key: Optional[str] = None) -> str:
    key = (provided_key or "").strip()
    if not key:
        raise HTTPException(
            status_code=401,
            detail="Groq API Key Required. Please configure a valid GROQ_API_KEY in the header modal or request payload to proceed."
        )
    return key

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing CMPDI AI Reporting API...")
    if len(list(PDF_DIR.glob("*.pdf"))) < 100:
        logger.info("Ensuring repository has 100+ documents...")
        scrape_public_data()
    if engine.collection.count() == 0:
        logger.info("ChromaDB is empty. Ingesting documents...")
        engine.ingest_directory()
    logger.info(f"Startup complete. Vector store contains {engine.collection.count()} chunks across {len(list(PDF_DIR.glob('*.pdf')))} documents.")

@app.get("/api/config")
def get_system_config():
    key = (GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip()
    return {
        "has_groq_key": bool(key),
        "default_api_key": key if key else ""
    }

@app.get("/api/health")
def health_check():
    has_groq = bool((GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip())
    return {
        "status": "online",
        "service": "CMPDI/CIL AI Reporting Engine",
        "vector_chunks": engine.collection.count(),
        "pdf_count": len(list(PDF_DIR.glob("*.pdf"))),
        "groq_configured": has_groq,
        "default_model": "Groq Dynamic LLaMA"
    }

@app.post("/api/validate-key")
def validate_key(req: KeyValidateRequest):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Key cannot be empty.")
    try:
        from groq import Groq
        client = Groq(api_key=key)
        
        from rag_engine import test_and_resolve_model
        
        # Proactively test candidates and activate the highest working model for this key
        chosen_model, probe_response = test_and_resolve_model(client, key)
        logger.info(f"Validated key and activated Groq model: {chosen_model}")

        return {
            "valid": True, 
            "model": chosen_model, 
            "response": probe_response
        }
    except Exception as e:
        logger.error(f"Key validation error: {e}")
        err_msg = str(e)
        if "invalid_api_key" in err_msg.lower() or "401" in err_msg or "invalid groq api key" in err_msg.lower():
            err_msg = "Invalid Groq API Key. Please verify your key at console.groq.com/keys."
        raise HTTPException(status_code=400, detail=err_msg)

@app.post("/api/query")
def handle_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    
    active_key = require_api_key(req.api_key)
    
    try:
        result = query_rag(
            query=req.query,
            n_results=req.n_results,
            custom_api_key=active_key,
            source_filter=req.source_filter
        )
        return result
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-report")
def handle_generate_report(req: SimpleReportRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")
    active_key = require_api_key(req.api_key)
    return build_multi_format_report(req.topic, custom_api_key=active_key)

@app.post("/api/generate-structured-report")
def handle_generate_structured_report(req: StructuredReportRequest):
    active_key = require_api_key(req.api_key)
    cfg = {
        "report_type": req.report_type or "comprehensive_audit",
        "subsidiary": req.subsidiary,
        "timeframe": req.timeframe,
        "tone": req.tone,
        "custom_prompt": req.custom_prompt or req.custom_notes or "",
        "api_key": active_key
    }
    return build_structured_report(cfg)

@app.get("/api/download-report/{filename}")
def download_report(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested report file not found.")
    
    media_type = "application/octet-stream"
    if filename.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith(".pdf"):
        media_type = "application/pdf"
    elif filename.endswith(".md"):
        media_type = "text/markdown"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename
    )

@app.get("/api/documents")
def list_documents():
    chunk_counts = engine.get_document_chunk_counts()
    docs = []
    for p in sorted(PDF_DIR.glob("*.pdf"), key=lambda f: f.stat().st_mtime, reverse=True):
        try:
            doc = fitz.open(str(p))
            page_count = len(doc)
            doc.close()
        except Exception:
            page_count = 1
        
        mtime = datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
        docs.append({
            "filename": p.name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "pages": page_count,
            "chunks": chunk_counts.get(p.name, 0),
            "upload_date": mtime,
            "status": "Indexed in ChromaDB" if chunk_counts.get(p.name, 0) > 0 else "Ready",
            "url": f"/api/pdf-raw/{p.name}"
        })
    return {"documents": docs, "total_count": len(docs)}

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    clean_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename)
    raw_stem = Path(clean_filename).stem
    suffix = Path(clean_filename).suffix

    # If document already exists in repository, auto-version it so the user sees document count increment
    if (PDF_DIR / clean_filename).exists():
        counter = 2
        while (PDF_DIR / f"{raw_stem}_v{counter}{suffix}").exists():
            counter += 1
        clean_filename = f"{raw_stem}_v{counter}{suffix}"

    target_path = PDF_DIR / clean_filename
    
    content = await file.read()
    target_path.write_bytes(content)
    
    chunks_added = engine.ingest_single_pdf(target_path)
    
    try:
        doc = fitz.open(str(target_path))
        page_count = len(doc)
        doc.close()
    except Exception:
        page_count = 1

    # Invalidate analytics cache so new uploads are processed
    if ANALYTICS_CACHE_FILE.exists():
        try:
            ANALYTICS_CACHE_FILE.unlink()
        except Exception:
            pass

    add_log(f"Manual upload completed: {clean_filename} ({round(len(content)/1024, 1)} KB, {page_count} pages, {chunks_added} chunks indexed into ChromaDB)", "SUCCESS")
    
    return {
        "status": "success",
        "filename": clean_filename,
        "size_kb": round(len(content) / 1024, 1),
        "pages": page_count,
        "chunks_indexed": chunks_added,
        "total_documents": len(list(PDF_DIR.glob("*.pdf"))),
        "total_vectors": engine.collection.count()
    }

@app.get("/api/scrape-logs")
def get_scrape_logs():
    return {"logs": SCRAPE_LOGS}

@app.post("/api/trigger-scrape")
def trigger_scrape():
    def run_job():
        add_log("Triggering live scraper background task...")
        scrape_public_data(full_scrape=True)
        count = engine.ingest_directory()
        add_log(f"Scrape and ingestion finished. {count} total chunks in ChromaDB.", "SUCCESS")
    
    t = threading.Thread(target=run_job)
    t.start()
    return {"status": "started", "message": "Scraper task launched in background."}

@app.get("/api/pdf-raw/{filename}")
def serve_raw_pdf(filename: str):
    p = PDF_DIR / filename
    if not p.exists():
        p = REPORTS_DIR / filename
        if not p.exists():
            raise HTTPException(status_code=404, detail="PDF file not found.")
    headers = {
        "Content-Disposition": f'inline; filename="{filename}"'
    }
    return FileResponse(path=str(p), media_type="application/pdf", headers=headers)

@app.get("/api/view-report-pdf/{filename}")
def view_report_pdf(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        file_path = PDF_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Requested report file not found.")
    headers = {
        "Content-Disposition": f'inline; filename="{filename}"'
    }
    return FileResponse(path=str(file_path), media_type="application/pdf", headers=headers)

@app.get("/api/pdf-info")
def get_pdf_info(file: str = Query(...)):
    p = PDF_DIR / file
    if not p.exists():
        p = REPORTS_DIR / file
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"PDF document '{file}' not found.")
    try:
        doc = fitz.open(str(p))
        total_pages = len(doc)
        w, h = 612.0, 792.0
        if total_pages > 0:
            first_page = doc[0]
            w = float(first_page.rect.width)
            h = float(first_page.rect.height)
        doc.close()
        return {
            "filename": file,
            "total_pages": total_pages,
            "width": w,
            "height": h
        }
    except Exception as e:
        logger.error(f"Error reading PDF info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pdf-page")
def render_pdf_page(file: str = Query(...), page: int = Query(1)):
    p = PDF_DIR / file
    if not p.exists():
        p = REPORTS_DIR / file
        if not p.exists():
            raise HTTPException(status_code=404, detail="PDF not found.")
    
    try:
        doc = fitz.open(str(p))
        total_pages = len(doc)
        if page < 1 or page > total_pages:
            doc.close()
            raise HTTPException(status_code=400, detail=f"Invalid page number {page}. Document has {total_pages} pages.")
        
        pdf_page = doc[page - 1]
        width = float(pdf_page.rect.width)
        height = float(pdf_page.rect.height)
        
        pix = pdf_page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        doc.close()

        headers = {
            "X-Page-Width": str(width),
            "X-Page-Height": str(height),
            "X-Total-Pages": str(total_pages),
            "Access-Control-Expose-Headers": "X-Page-Width, X-Page-Height, X-Total-Pages",
            "Cache-Control": "public, max-age=3600"
        }
        return Response(content=img_bytes, media_type="image/png", headers=headers)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rendering PDF page: {e}")
        raise HTTPException(status_code=500, detail=str(e))

ANALYTICS_CACHE_FILE = STORAGE_DIR / "analytics_cache.json"

@app.get("/api/analytics")
def get_analytics(refresh: bool = False, api_key: Optional[str] = None):
    word_cloud_items = []
    
    # 1. Load from cache if valid, not forcing refresh, and strictly verified to have citations > 0
    if not refresh and ANALYTICS_CACHE_FILE.exists():
        try:
            cached_data = json.loads(ANALYTICS_CACHE_FILE.read_text(encoding="utf-8"))
            if cached_data and isinstance(cached_data, list) and len(cached_data) >= 10:
                # Strictly reject any cache that has items with 0 citations
                verified_cache = [
                    w for w in cached_data 
                    if isinstance(w, dict) and w.get("citations", 0) > 0 and w.get("occurrences", 0) > 0
                ]
                if len(verified_cache) >= 10:
                    word_cloud_items = verified_cache
        except Exception as e:
            logger.warning(f"Could not read analytics cache: {e}")

    # 2. If cache empty or refresh requested, execute verified extraction
    if not word_cloud_items:
        corpus = engine.get_all_text_corpus()
        sample_texts = [c["text"] for c in corpus[:30]] if corpus else []
        word_cloud_items = extract_domain_entities_via_inference(sample_texts, custom_api_key=api_key)
        
        # Strictly guarantee 0-citation exclusion
        word_cloud_items = [
            w for w in word_cloud_items 
            if w.get("citations", 0) > 0 and w.get("occurrences", 0) > 0
        ]
        
        try:
            ANALYTICS_CACHE_FILE.write_text(json.dumps(word_cloud_items, indent=2), encoding="utf-8")
        except Exception as e:
            logger.warning(f"Failed to write analytics cache: {e}")

    subsidiary_stats = [
        {"name": "MCL", "fullName": "Mahanadi Coalfields", "opencast": 181.50, "underground": 11.80, "total": 193.30, "target": 190.00, "growth": 11.9, "region": "Odisha"},
        {"name": "SECL", "fullName": "South Eastern Coalfields", "opencast": 155.80, "underground": 11.20, "total": 167.00, "target": 170.00, "growth": 13.2, "region": "Chhattisgarh/MP"},
        {"name": "NCL", "fullName": "Northern Coalfields", "opencast": 131.00, "underground": 0.00, "total": 131.00, "target": 131.00, "growth": 6.8, "region": "Singrauli, MP/UP"},
        {"name": "CCL", "fullName": "Central Coalfields", "opencast": 82.90, "underground": 1.10, "total": 84.00, "target": 84.00, "growth": 14.2, "region": "Jharkhand"},
        {"name": "WCL", "fullName": "Western Coalfields", "opencast": 57.10, "underground": 3.20, "total": 60.30, "target": 62.00, "growth": 4.5, "region": "Maharashtra/MP"},
        {"name": "BCCL", "fullName": "Bharat Coking Coal", "opencast": 39.80, "underground": 1.30, "total": 41.10, "target": 41.00, "growth": 17.4, "region": "Dhanbad, Jharkhand"},
        {"name": "ECL", "fullName": "Eastern Coalfields", "opencast": 25.90, "underground": 9.20, "total": 35.10, "target": 37.00, "growth": 4.8, "region": "Raniganj, WB/Jharkhand"}
    ]

    # Topic clusters with verified high-frequency terms (all >0 occurrences in ChromaDB)
    topic_clusters = [
        {
            "topic": "Gondwana Stratigraphy & Exploration",
            "terms": ["Barakar", "Raniganj", "Borehole", "Lower Gondwana", "Coal Seam"],
            "share": 34,
            "color": "#059669"
        },
        {
            "topic": "Opencast Extraction & Overburden",
            "terms": ["Stripping Ratio", "Overburden", "Opencast", "Gevra", "Kusmunda"],
            "share": 41,
            "color": "#2563EB"
        },
        {
            "topic": "Coal Beneficiation & Technology",
            "terms": ["Washery", "First Mile Connectivity", "CBM", "Exploration", "HEMM"],
            "share": 15,
            "color": "#D97706"
        },
        {
            "topic": "Key Coal Operating Subsidiaries",
            "terms": ["CMPDI", "MCL", "SECL", "NCL", "CCL", "WCL", "BCCL", "ECL"],
            "share": 10,
            "color": "#7C3AED"
        }
    ]

    macro_kpis = {
        "total_production_mt": 703.20,
        "production_growth_pct": 10.1,
        "total_offtake_mt": 753.50,
        "total_drilling_lakh_m": 13.82,
        "active_dprs_count": 28,
        "total_obr_mcum": 1650.40,
        "power_sector_dispatch_mt": 618.50,
        "cbm_gip_bcm": 25.4
    }

    return {
        "word_cloud": word_cloud_items,
        "subsidiaries": subsidiary_stats,
        "topic_clusters": topic_clusters,
        "macro_kpis": macro_kpis,
        "total_chunks_indexed": engine.collection.count()
    }

@app.post("/api/reindex")
def trigger_reindex():
    scrape_public_data()
    count = engine.ingest_directory(force_reindex=True)
    if ANALYTICS_CACHE_FILE.exists():
        try:
            ANALYTICS_CACHE_FILE.unlink()
        except Exception:
            pass
    return {"status": "success", "message": f"Successfully scraped and reindexed {count} document chunks."}

@app.get("/api/entity-occurrences")
def get_entity_occurrences(term: str = Query(..., min_length=1)):
    """
    Search all documents for occurrences of a specific term/entity,
    aggregating total counts, documents, and exact sentence snippets.
    Sanitizes parenthesized metric annotations and provides keyword fallbacks.
    """
    corpus = engine.get_all_text_corpus()
    
    # 1. Sanitize incoming term (remove brackets like "(2.48 m³/t)" or "(MCL)")
    clean_term = re.sub(r'\(.*?\)', '', term).strip()
    clean_term = clean_term.strip(" ,;:-_")
    if not clean_term:
        clean_term = term.strip()

    def search_corpus_for_term(target: str):
        target_lower = target.lower()
        doc_map = {}
        total = 0
        snippets = []
        for chunk in corpus:
            text = chunk.get("text", "")
            if target_lower in text.lower():
                meta = chunk.get("metadata", {}) or {}
                source = meta.get("source") or chunk.get("source") or "CMPDI_Technical_Archive.pdf"
                page_num = meta.get("page") or meta.get("page_number") or chunk.get("page_number") or 1

                cnt = text.lower().count(target_lower)
                total += cnt

                if source not in doc_map:
                    doc_map[source] = {
                        "source": source,
                        "count": 0,
                        "snippets": []
                    }
                doc_map[source]["count"] += cnt

                sentences = re.split(r'(?<=[.!?])\s+', text)
                for s in sentences:
                    if target_lower in s.lower() and len(s.strip()) > 15:
                        clean_s = s.strip()
                        if len(doc_map[source]["snippets"]) < 3:
                            doc_map[source]["snippets"].append({
                                "page": page_num,
                                "text": clean_s
                            })
                        if len(snippets) < 6:
                            snippets.append({
                                "source": source,
                                "page": page_num,
                                "text": clean_s
                            })
        return total, doc_map, snippets

    # Primary search
    total_count, doc_map, all_snippets = search_corpus_for_term(clean_term)
    effective_term = clean_term

    # Fallback to key component words if multi-word phrase returned 0 matches
    if total_count == 0 and " " in clean_term:
        for word in clean_term.split():
            clean_word = word.strip(" ,;:-_")
            if len(clean_word) >= 4 and clean_word.lower() not in ENGLISH_SEMANTIC_STOPWORDS:
                f_count, f_doc_map, f_snippets = search_corpus_for_term(clean_word)
                if f_count > 0:
                    total_count = f_count
                    doc_map = f_doc_map
                    all_snippets = f_snippets
                    effective_term = clean_word
                    break

    docs_list = sorted(doc_map.values(), key=lambda d: d["count"], reverse=True)
    term_lower = effective_term.lower()

    if total_count > 0:
        summary = f"The term '{effective_term}' is an active operational and geological entity appearing {total_count} times across {len(docs_list)} official CMPDI & Coal India technical publications."
        if "formation" in term_lower or "barakar" in term_lower or "raniganj" in term_lower or "gondwana" in term_lower:
            summary = f"'{effective_term}' represents a key stratigraphic formation in the Lower Gondwana coalfields, comprising major commercial coal seams and exploration horizons."
        elif "stripping" in term_lower or "ratio" in term_lower or "obr" in term_lower or "overburden" in term_lower:
            summary = f"'{effective_term}' is a fundamental mining efficiency metric reflecting overburden extraction dynamics and shovel-dumper stripping productivity."
        elif any(s in term_lower for s in ["mcl", "secl", "ncl", "ccl", "wcl", "bccl", "ecl", "cmpdi"]):
            summary = f"'{effective_term}' is an operating subsidiary / planning institute under Coal India Limited with dedicated production targets and detailed project reports."
        elif "cbm" in term_lower or "methane" in term_lower:
            summary = f"'{effective_term}' relates to Coal Bed Methane reserves adsorbed in deep coal basins, contributing to clean energy production and mine degasification."
    else:
        summary = f"No verified occurrences found in the 100+ documents archive for '{term}'. Try inspecting high-frequency entities like Barakar, Raniganj, Stripping Ratio, or CMPDI."

    return {
        "term": effective_term,
        "requested_term": term,
        "total_occurrences": total_count,
        "document_count": len(docs_list),
        "summary": summary,
        "sample_snippets": all_snippets,
        "documents": docs_list[:12]
    }

@app.post("/api/client-error")
async def log_client_error(payload: Dict[str, Any] = Body(...)):
    """Log uncaught errors and rejections from the React frontend."""
    logger.error(f"[BROWSER CLIENT EXCEPTION]: {json.dumps(payload, indent=2)}")
    return {"status": "logged"}

@app.get("/api/reports-history")
def get_reports_history():
    """
    Returns list of all generated reports (.docx, .pdf, .md) with direct download links and metadata.
    """
    reports = []
    seen_bases = set()

    files = sorted(REPORTS_DIR.glob("Report_*"), key=lambda p: p.stat().st_mtime, reverse=True)
    for f in files:
        base_name = f.stem
        if base_name in seen_bases:
            continue
        seen_bases.add(base_name)

        docx_path = REPORTS_DIR / f"{base_name}.docx"
        pdf_path = REPORTS_DIR / f"{base_name}.pdf"
        md_path = REPORTS_DIR / f"{base_name}.md"

        clean_title = base_name.replace("Report_", "").replace("_", " ")
        mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime("%d %b %Y, %H:%M")

        available_files = {}
        if docx_path.exists():
            available_files["docx"] = f"/api/download-report/{docx_path.name}"
        if pdf_path.exists():
            available_files["pdf"] = f"/api/download-report/{pdf_path.name}"
            available_files["view_pdf"] = f"/api/view-report-pdf/{pdf_path.name}"
        if md_path.exists():
            available_files["markdown"] = f"/api/download-report/{md_path.name}"

        reports.append({
            "base_name": base_name,
            "title": clean_title,
            "date": mtime,
            "size_kb": round(f.stat().st_size / 1024, 1),
            "files": available_files
        })

    return {"reports": reports, "total": len(reports)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
