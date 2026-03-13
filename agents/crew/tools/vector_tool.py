from agents.crew.db.mongo import jobs_col

# FAISS vector index — populated lazily when documents are indexed.
# Falls back to MongoDB text search when the index is not yet built.
index = None  # Set externally via build_index() once documents are available


def build_index(documents):
    """Call with a list of LlamaIndex Document objects to enable vector search."""
    global index
    from llama_index.core import VectorStoreIndex
    index = VectorStoreIndex.from_documents(documents)


def semantic_job_search(query: str):
    if index:
        return index.as_query_engine().query(query)
    # Fallback: basic MongoDB text search on title and description
    results = list(jobs_col.find(
        {"$text": {"$search": query}},
        {"title": 1, "company": 1, "tagTileStatus": 1}
    ).limit(10))
    return [r.get("title", "") for r in results] if results else []
