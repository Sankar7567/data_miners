import logging
from rag_engine import query_rag

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("benchmark")

def run_benchmark():
    eval_queries = [
        "What is the stripping ratio for MCL?",
        "Explain CBM potential in Jharia coalfield.",
        "How much exploratory drilling did CMPDI achieve?",
        "What are the safety protocols for opencast mines?"
    ]

    results = []
    for query in eval_queries:
        logger.info(f"Evaluating: {query}")
        result = query_rag(query)
        # Simple evaluation: check if answer provides info and has citations
        score = 1.0 if result["citations"] and len(result["answer"]) > 50 else 0.0
        results.append({"query": query, "score": score, "answer_len": len(result["answer"])})

    avg_score = sum(r["score"] for r in results) / len(results)
    logger.info(f"Benchmark finished. Average Score: {avg_score}")
    return results

if __name__ == "__main__":
    run_benchmark()
