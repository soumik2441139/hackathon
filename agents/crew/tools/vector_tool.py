from llama_index.core import VectorStoreIndex

index = None  # Built dynamically when actual documents are loaded

def semantic_job_search(query):
    if not index:
        return []
    return index.as_query_engine().query(query)
