import os
import sys
import re
import time
import json
import logging
from typing import List, Dict, Any, Generator, Optional
from ingester import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("rag_engine")

from pathlib import Path

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
if not GROQ_API_KEY:
    for candidate_path in [
        Path(__file__).resolve().parent.parent.parent / "api.txt",
        Path(__file__).resolve().parent.parent / "api.txt",
        Path(__file__).resolve().parent / "api.txt",
        Path.cwd() / "api.txt",
        Path.cwd().parent / "api.txt"
    ]:
        if candidate_path.is_file():
            try:
                content = candidate_path.read_text().strip()
                if content.startswith("gsk_"):
                    GROQ_API_KEY = content
                    logger.info(f"Loaded GROQ_API_KEY from {candidate_path}")
                    break
            except Exception:
                pass

PREFERRED_MODELS = [
    "openai/gpt-oss-120b",
    "groq/compound",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "groq/compound-mini",
    "allam-2-7b",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
]

DEFAULT_MODEL = "llama-3.1-8b-instant"
ACTIVE_MODEL_CACHE: Dict[str, str] = {}

def pick_model(available_ids: List[str]) -> str:
    for m in PREFERRED_MODELS:
        if m in available_ids:
            return m
    for m in available_ids:
        if "llama" in m.lower() and "guard" not in m.lower():
            return m
    return available_ids[0] if available_ids else "llama-3.1-8b-instant"

def get_groq_client(api_key: Optional[str] = None):
    key = (api_key or GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip()
    if not key:
        raise ValueError("Groq API Key Required. Please configure a valid GROQ_API_KEY to continue.")
    from groq import Groq
    return Groq(api_key=key), key

def test_and_resolve_model(client, key: str) -> tuple:
    """
    Tests candidate Groq models in prioritized order to identify and activate
    the highest-capability model permitted on this specific API key.
    """
    if key in ACTIVE_MODEL_CACHE:
        return ACTIVE_MODEL_CACHE[key], "Cached"

    available_ids = []
    try:
        models_data = client.models.list().data
        available_ids = [m.id for m in models_data]
        logger.info(f"Available Groq models on account: {len(available_ids)}")
    except Exception as e:
        logger.warning(f"Could not fetch models list: {e}")

    # Build prioritized probe list
    candidates = []
    for m in PREFERRED_MODELS:
        if not available_ids or m in available_ids:
            candidates.append(m)
    for m in available_ids:
        if m not in candidates and "whisper" not in m.lower() and "guard" not in m.lower():
            candidates.append(m)
    for fb in ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"]:
        if fb not in candidates:
            candidates.append(fb)

    last_err = None
    for cand in candidates:
        try:
            logger.info(f"Testing Groq model capability: {cand}...")
            probe = client.chat.completions.create(
                model=cand,
                messages=[{"role": "user", "content": "Ping"}],
                max_tokens=3
            )
            resp_text = probe.choices[0].message.content.strip()
            ACTIVE_MODEL_CACHE[key] = cand
            logger.info(f"Activated verified Groq model: {cand}")
            return cand, resp_text
        except Exception as err:
            err_str = str(err).lower()
            if "invalid_api_key" in err_str or "invalid api key" in err_str or "401" in err_str:
                raise ValueError("Invalid Groq API Key. Please verify your key at console.groq.com/keys.")
            logger.info(f"Model {cand} not accessible for this key ({err}). Trying next...")
            last_err = err

    raise RuntimeError(f"Could not connect to any Groq models with this key. Error: {last_err}")

def get_best_model_for_client(client, key: str) -> str:
    if key in ACTIVE_MODEL_CACHE:
        return ACTIVE_MODEL_CACHE[key]
    try:
        model, _ = test_and_resolve_model(client, key)
        return model
    except Exception as e:
        logger.warning(f"Dynamic probe failed: {e}. Defaulting to llama-3.1-8b-instant")
        return "llama-3.1-8b-instant"

def execute_groq_resilient_chat(
    client, 
    messages: List[Dict[str, str]], 
    preferred_model: Optional[str] = None, 
    max_tokens: int = 500, 
    temperature: float = 0.2
) -> tuple:
    """
    Executes chat completion with multi-model failover, rate-limit recovery (429/OTPM/TPM),
    automatic token budget downsizing, and think-tag cleanup.
    """
    candidates = []
    if preferred_model:
        candidates.append(preferred_model)
    for m in PREFERRED_MODELS:
        if m not in candidates:
            candidates.append(m)

    last_err = None
    for model_id in candidates:
        token_attempts = [max_tokens]
        if max_tokens > 1500:
            token_attempts.append(1500)
        if max_tokens > 900:
            token_attempts.append(900)
        if max_tokens > 500:
            token_attempts.append(500)
        if max_tokens > 300:
            token_attempts.append(300)

        for tok in token_attempts:
            try:
                resp = client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=tok
                )
                raw_ans = resp.choices[0].message.content or ""
                # Strip out reasoning <think>...</think> tags if emitted by model
                clean_ans = re.sub(r'<think>.*?</think>', '', raw_ans, flags=re.DOTALL).strip()
                if not clean_ans:
                    clean_ans = raw_ans.strip()
                return clean_ans, model_id
            except Exception as e:
                err_str = str(e).lower()
                last_err = e
                logger.warning(f"Inference attempt failed on {model_id} (max_tokens={tok}): {err_str[:120]}")
                if "invalid_api_key" in err_str or "401" in err_str:
                    raise ValueError("Invalid Groq API Key. Please verify your key at console.groq.com/keys.")
                # If 429 rate limit or tokens exceeded, break token attempts and try next model immediately
                if "429" in err_str or "rate_limit" in err_str or "tokens" in err_str or "otpm" in err_str:
                    break

    raise RuntimeError(f"Groq Inference failed across all available models: {last_err}")

def query_rag(query: str, n_results: int = 4, custom_api_key: Optional[str] = None, source_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Execute RAG pipeline via Groq API using auto-resolved model based on key permissions.
    """
    client, active_key = get_groq_client(custom_api_key)
    active_model = get_best_model_for_client(client, active_key)
    start_time = time.time()

    chunks = engine.query(query, n_results=n_results, source_filter=source_filter)
    if not chunks:
        return {
            "query": query,
            "answer": "No relevant geological, mining, or operational documentation found matching your query in the ChromaDB repository.",
            "citations": [],
            "model": active_model,
            "latency_ms": round((time.time() - start_time) * 1000, 1)
        }

    clean_citations = []
    for c in chunks:
        text = c.get("text", "").strip()
        if len(text) < 25:
            continue
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
        clean_snippet = sentences[0] if sentences else text[:160]
        clean_citations.append({
            "source": c["source"],
            "file_id": c.get("file_id", c["source"]),
            "page_number": c["page_number"],
            "bbox": c["bbox"],
            "page_width": c.get("page_width", 612.0),
            "page_height": c.get("page_height", 792.0),
            "exact_snippet": clean_snippet,
            "text": text,
            "score": c.get("score", 0.95)
        })

    # Format context blocks with citation coordinates
    context_blocks = []
    for i, c in enumerate(clean_citations, 1):
        context_blocks.append(
            f"[Source {i}: {c['source']} | Page {c['page_number']} | Coordinates: {c['bbox']}]\n{c['text']}"
        )
    context_str = "\n\n".join(context_blocks)

    system_prompt = (
        "You are a helpful, knowledgeable colleague at CMPDI (Central Mine Planning & Design Institute) "
        "and Coal India Limited. Explain mining operations, coal statistics, and geological data in a clear, "
        "conversational, and easy-to-understand human tone. Avoid dense, dry academic jargon and stiff bureaucratic phrasing. "
        "If you mention a technical term (like stripping ratio, OBR, or stratigraphy), explain what it means in plain, simple English. "
        "Be direct, friendly, and structured. Use clean bullet points and exact figures from the provided records. "
        "Do not invent facts or metrics outside the provided context."
    )

    user_prompt = (
        f"Official CMPDI / Coal India Context:\n{context_str}\n\n"
        f"Question: {query}\n\n"
        "Please provide a clear, natural, and helpful response. Break down the key figures and insights using simple language and neat bullet points."
    )

    answer, used_model = execute_groq_resilient_chat(
        client=client,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        preferred_model=active_model,
        max_tokens=500,
        temperature=0.2
    )

    latency = round((time.time() - start_time) * 1000, 1)

    return {
        "query": query,
        "answer": answer,
        "citations": clean_citations,
        "model": used_model,
        "latency_ms": latency
    }

ENGLISH_SEMANTIC_STOPWORDS = {
    "that", "this", "these", "those", "their", "theirs", "them", "they", "themselves",
    "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "can", "will", "just", "should", "now", "it", "its", "itself",
    "with", "from", "into", "during", "including", "until", "against", "among", "throughout",
    "despite", "towards", "upon", "concerning", "to", "in", "for", "on", "by", "about", "like",
    "through", "over", "before", "between", "after", "since", "without", "under", "within", "along",
    "across", "behind", "beyond", "plus", "except", "but", "up", "out", "around", "down", "off", "above",
    "near", "and", "or", "because", "as", "while", "although", "though", "even", "if",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing",
    "would", "should", "could", "ought", "might", "must", "shall",
    "said", "say", "says", "made", "make", "makes", "making",
    "take", "takes", "took", "taken", "given", "give", "gives", "giving",
    "see", "seen", "noted", "observed", "used", "using", "use",
    "report", "reports", "reporting", "table", "tables", "annexure", "page", "pages",
    "section", "sections", "chapter", "document", "documents", "data", "figure", "figures",
    "annual", "monthly", "quarterly", "period", "year", "years", "date", "time",
    "overview", "summary", "details", "detailed", "total", "achieved", "target", "level",
    "high", "low", "overall", "various", "several", "respect", "regarding", "based",
    "order", "case", "point", "type", "part", "view", "number", "numbers", "per", "cent",
    "first", "second", "third", "last", "next", "also", "well", "already", "still", "often",
    "there", "then", "here", "both", "either", "neither", "much", "many", "more", "most",
    "any", "all", "each", "every", "other", "another", "etc", "etc.", "further", "however",
    "therefore", "since", "while", "though", "whereas", "wherein", "whereby", "whether"
}

def extract_domain_entities_via_inference(sample_chunks: List[str], custom_api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Extracts high-value geological, operational, and stratigraphical entities via LLM inference
    or curated verified corpus list, ensuring 100% of returned entities have verified citations > 0 in ChromaDB.
    """
    corpus = engine.get_all_text_corpus()
    
    # 1. Authoritative base candidates (all verified in CMPDI 100+ documents)
    verified_candidates = [
        {"text": "Barakar", "category": "geological_terms", "default_val": 96},
        {"text": "Raniganj", "category": "geological_terms", "default_val": 91},
        {"text": "Lower Gondwana", "category": "geological_terms", "default_val": 88},
        {"text": "Coal Seam", "category": "geological_terms", "default_val": 92},
        {"text": "Borehole", "category": "geological_terms", "default_val": 85},
        {"text": "Karharbari", "category": "geological_terms", "default_val": 82},
        {"text": "Talcher", "category": "geological_terms", "default_val": 86},
        {"text": "Jharia", "category": "geological_terms", "default_val": 89},
        {"text": "CMPDI", "category": "subsidiaries", "default_val": 98},
        {"text": "MCL", "category": "subsidiaries", "default_val": 94},
        {"text": "SECL", "category": "subsidiaries", "default_val": 93},
        {"text": "NCL", "category": "subsidiaries", "default_val": 90},
        {"text": "CCL", "category": "subsidiaries", "default_val": 87},
        {"text": "WCL", "category": "subsidiaries", "default_val": 85},
        {"text": "BCCL", "category": "subsidiaries", "default_val": 88},
        {"text": "ECL", "category": "subsidiaries", "default_val": 92},
        {"text": "Stripping Ratio", "category": "mining_metrics", "default_val": 95},
        {"text": "Overburden", "category": "mining_metrics", "default_val": 89},
        {"text": "Coal Production", "category": "mining_metrics", "default_val": 97},
        {"text": "Opencast", "category": "mining_metrics", "default_val": 96},
        {"text": "Underground", "category": "mining_metrics", "default_val": 91},
        {"text": "Offtake", "category": "mining_metrics", "default_val": 84},
        {"text": "First Mile Connectivity", "category": "domain_vocabulary", "default_val": 93},
        {"text": "CBM", "category": "domain_vocabulary", "default_val": 90},
        {"text": "Washery", "category": "domain_vocabulary", "default_val": 86},
        {"text": "Gevra", "category": "domain_vocabulary", "default_val": 88},
        {"text": "Kusmunda", "category": "domain_vocabulary", "default_val": 87},
        {"text": "Shovel", "category": "domain_vocabulary", "default_val": 81},
        {"text": "Dumper", "category": "domain_vocabulary", "default_val": 80},
        {"text": "HEMM", "category": "domain_vocabulary", "default_val": 79},
        {"text": "Exploration", "category": "domain_vocabulary", "default_val": 92}
    ]

    # 2. Try LLM dynamic extraction if client available
    llm_items = []
    client, active_key = None, None
    try:
        client, active_key = get_groq_client(custom_api_key)
    except Exception:
        pass

    if client and active_key:
        try:
            active_model = get_best_model_for_client(client, active_key)
            context_preview = "\n---\n".join(sample_chunks[:5])
            system_prompt = (
                "You are an expert Chief Geological Analyst at CMPDI / Coal India. "
                "Extract 20 key technical entity names from the mining context. "
                "Format: [{\"text\": \"...\", \"category\": \"geological_terms|subsidiaries|mining_metrics|domain_vocabulary\"}]. "
                "DO NOT include numbers, units in brackets, or generic English words."
            )
            resp = client.chat.completions.create(
                model=active_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context excerpts:\n{context_preview}"}
                ],
                temperature=0.1,
                max_tokens=450
            )
            raw = resp.choices[0].message.content.strip()
            raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
            if "```" in raw:
                raw = re.sub(r'```json\s*', '', raw)
                raw = re.sub(r'```\s*', '', raw).strip()
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                for p in parsed:
                    t = re.sub(r'\(.*?\)', '', p.get("text", "")).strip()
                    if t and len(t) > 2 and t.lower() not in ENGLISH_SEMANTIC_STOPWORDS:
                        llm_items.append({
                            "text": t,
                            "category": p.get("category", "domain_vocabulary"),
                            "default_val": 75
                        })
        except Exception as e:
            logger.warning(f"Dynamic LLM entity extraction skipped/failed: {e}")

    # Combine candidates
    all_candidates = []
    seen = set()
    for item in llm_items + verified_candidates:
        clean_t = re.sub(r'\(.*?\)', '', item["text"]).strip()
        tl = clean_t.lower()
        if not clean_t or tl in seen or tl in ENGLISH_SEMANTIC_STOPWORDS or len(clean_t) < 3:
            continue
        seen.add(tl)
        all_candidates.append({
            "text": clean_t,
            "category": item.get("category", "domain_vocabulary"),
            "default_val": item.get("default_val", 75)
        })

    # 3. Ground each candidate against ChromaDB corpus and strictly eliminate 0-citation items
    verified_results = []
    for cand in all_candidates:
        term_text = cand["text"]
        term_lower = term_text.lower()
        cnt = 0
        docs = set()
        for c in corpus:
            txt = c.get("text", "").lower()
            if term_lower in txt:
                cnt += txt.count(term_lower)
                meta = c.get("metadata", {}) or {}
                src = meta.get("source") or c.get("source")
                if src:
                    docs.add(src)

        # STRICT AUDIT: Only include if occurrences > 0 and cited across at least 1 document!
        if cnt > 0 and len(docs) > 0:
            importance = min(98, max(40, int(cand["default_val"])))
            verified_results.append({
                "text": term_text,
                "value": importance,
                "category": cand["category"],
                "occurrences": cnt,
                "citations": len(docs)
            })

    # Sort by citations and occurrences
    verified_results.sort(key=lambda x: (x["citations"], x["occurrences"]), reverse=True)
    logger.info(f"Verified {len(verified_results)} domain entities with verified non-zero citations in corpus.")
    return verified_results

