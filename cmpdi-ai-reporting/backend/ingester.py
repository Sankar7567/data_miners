import os
import sys
import json
import re
import hashlib
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

import fitz  # PyMuPDF
import numpy as np
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingester")

STORAGE_DIR = Path(__file__).resolve().parent / "storage"
PDF_DIR = STORAGE_DIR / "pdfs"
CHROMA_DIR = STORAGE_DIR / "chroma"

PDF_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

class FastOfflineEmbedding(EmbeddingFunction):
    """
    Subword & token n-gram dense semantic embedding function (384-dim).
    Guarantees instant vector embeddings with cosine similarity.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _embed_single(self, text: str) -> List[float]:
        vec = np.zeros(self.dim, dtype=np.float32)
        clean_text = text.lower()
        words = re.findall(r'\b[a-z0-9_-]+\b', clean_text)
        if not words:
            return vec.tolist()

        features = []
        for w in words:
            features.append(w)
            if len(w) >= 3:
                for i in range(len(w) - 2):
                    features.append(w[i:i+3])
            if len(w) >= 4:
                for i in range(len(w) - 3):
                    features.append(w[i:i+4])

        for feat in features:
            h = int(hashlib.sha256(feat.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dim
            sign = 1.0 if ((h >> 8) & 1) == 0 else -1.0
            vec[idx] += sign

        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        return vec.tolist()

    def __call__(self, input: Documents) -> Embeddings:
        return [self._embed_single(doc) for doc in input]

class IngestionEngine:
    def __init__(self, persist_dir: Optional[Path] = None):
        self.persist_dir = persist_dir or CHROMA_DIR
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))
        self.embedding_fn = FastOfflineEmbedding(dim=384)
        self.collection = self.client.get_or_create_collection(
            name="cmpdi_reports",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"Initialized ChromaDB at {self.persist_dir} (Collection: cmpdi_reports)")

    def parse_pdf(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """
        Extract text blocks with exact page numbers, coordinates, and spatial bounding boxes.
        """
        records = []
        try:
            doc = fitz.open(str(pdf_path))
        except Exception as e:
            logger.error(f"Error opening PDF {pdf_path}: {e}")
            return []

        filename = pdf_path.name

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            page_w = float(page.rect.width)
            page_h = float(page.rect.height)

            blocks = page.get_text("blocks")
            page_records_start = len(records)
            for block_idx, b in enumerate(blocks):
                x0, y0, x1, y1, raw_text, block_no, btype = b
                text = raw_text.strip()
                if not text or len(text) < 10:
                    continue

                chunk_id = f"{filename}_p{page_num}_b{block_idx}"
                bbox = [round(float(x0), 2), round(float(y0), 2), round(float(x1), 2), round(float(y1), 2)]

                records.append({
                    "id": chunk_id,
                    "text": text,
                    "metadata": {
                        "source": filename,
                        "file_id": filename,
                        "page": page_num,
                        "page_width": page_w,
                        "page_height": page_h,
                        "bbox": json.dumps(bbox),
                        "bbox_x0": bbox[0],
                        "bbox_y0": bbox[1],
                        "bbox_x1": bbox[2],
                        "bbox_y1": bbox[3],
                        "block_no": int(block_no)
                    }
                })

            # If block parsing yielded 0 chunks for this page, fallback to full page text
            if len(records) == page_records_start:
                raw_page_text = page.get_text("text").strip()
                if raw_page_text:
                    chunk_id = f"{filename}_p{page_num}_b0"
                    bbox = [50.0, 50.0, max(100.0, page_w - 50.0), max(100.0, page_h - 50.0)]
                    records.append({
                        "id": chunk_id,
                        "text": raw_page_text[:2000],
                        "metadata": {
                            "source": filename,
                            "file_id": filename,
                            "page": page_num,
                            "page_width": page_w,
                            "page_height": page_h,
                            "bbox": json.dumps(bbox),
                            "bbox_x0": bbox[0],
                            "bbox_y0": bbox[1],
                            "bbox_x1": bbox[2],
                            "bbox_y1": bbox[3],
                            "block_no": 0
                        }
                    })

        doc.close()

        # Final guarantee: if PDF has no extractable text (e.g. image-only scan), index metadata placeholder
        if not records:
            records.append({
                "id": f"{filename}_p1_b0",
                "text": f"Scanned Geological Archival Document: {filename} (Uploaded into CMPDI Spatial Repository)",
                "metadata": {
                    "source": filename,
                    "file_id": filename,
                    "page": 1,
                    "page_width": 612.0,
                    "page_height": 792.0,
                    "bbox": json.dumps([50.0, 50.0, 562.0, 742.0]),
                    "bbox_x0": 50.0,
                    "bbox_y0": 50.0,
                    "bbox_x1": 562.0,
                    "bbox_y1": 742.0,
                    "block_no": 0
                }
            })

        return records

    def ingest_single_pdf(self, pdf_path: Path) -> int:
        """Ingest a single PDF file and upsert its chunks into ChromaDB."""
        chunks = self.parse_pdf(pdf_path)
        if not chunks:
            return 0

        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            self.collection.upsert(
                ids=[c["id"] for c in batch],
                documents=[c["text"] for c in batch],
                metadatas=[c["metadata"] for c in batch]
            )
        logger.info(f"Ingested {len(chunks)} chunks from {pdf_path.name}")
        return len(chunks)

    def ingest_directory(self, pdf_dir: Optional[Path] = None, force_reindex: bool = False) -> int:
        target_dir = pdf_dir or PDF_DIR
        pdf_files = list(target_dir.glob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files to index in {target_dir}")

        if force_reindex:
            try:
                self.client.delete_collection("cmpdi_reports")
                self.collection = self.client.get_or_create_collection(
                    name="cmpdi_reports",
                    embedding_function=self.embedding_fn,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info("Reset collection cmpdi_reports")
            except Exception as e:
                logger.warning(f"Could not reset collection: {e}")

        total_chunks = 0
        for pdf_p in pdf_files:
            count = self.ingest_single_pdf(pdf_p)
            total_chunks += count

        logger.info(f"Successfully indexed total {total_chunks} chunks into ChromaDB.")
        return total_chunks

    def get_document_chunk_counts(self) -> Dict[str, int]:
        """Return a mapping of filename -> indexed chunk count."""
        try:
            data = self.collection.get(include=["metadatas"])
            metas = data.get("metadatas", [])
            counts = {}
            for m in metas:
                src = m.get("source", "unknown")
                counts[src] = counts.get(src, 0) + 1
            return counts
        except Exception as e:
            logger.error(f"Error computing chunk counts: {e}")
            return {}

    def query(self, query_text: str, n_results: int = 4, source_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Query vector database and return chunks with coordinates and metadata.
        Optionally filter by a specific source PDF.
        """
        count = self.collection.count()
        if count == 0:
            self.ingest_directory()

        where_clause = None
        if source_filter and source_filter != "all":
            where_clause = {"source": source_filter}

        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=min(n_results, max(1, self.collection.count())),
                where=where_clause
            )
        except Exception as e:
            logger.warning(f"Query with filter failed: {e}. Falling back to unfiltered query.")
            results = self.collection.query(
                query_texts=[query_text],
                n_results=min(n_results, max(1, self.collection.count()))
            )

        formatted = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
            ids = results["ids"][0]

            for i in range(len(docs)):
                m = metas[i]
                bbox = json.loads(m.get("bbox", "[0,0,0,0]"))
                formatted.append({
                    "id": ids[i],
                    "text": docs[i],
                    "source": m.get("source"),
                    "file_id": m.get("file_id"),
                    "page_number": int(m.get("page", 1)),
                    "bbox": bbox,
                    "page_width": float(m.get("page_width", 612.0)),
                    "page_height": float(m.get("page_height", 792.0)),
                    "score": round(float(1.0 - dists[i]), 4) if i < len(dists) else 1.0,
                    "exact_snippet": docs[i][:280] + ("..." if len(docs[i]) > 280 else "")
                })

        return formatted

    def get_all_text_corpus(self) -> List[Dict[str, Any]]:
        """Retrieve all documents for topic modeling and word cloud extraction."""
        data = self.collection.get(include=["documents", "metadatas"])
        docs = data.get("documents", [])
        metas = data.get("metadatas", [])
        return [{"text": docs[i], "metadata": metas[i]} for i in range(len(docs))]

# Singleton instance
engine = IngestionEngine()
