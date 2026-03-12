# 🔧 Agent Tools

Functions that agents can call during their execution. CrewAI agents select and invoke these based on their task goals.

## Database Tools (`db_tool.py`)

| Tool | Description |
|------|-------------|
| `get_unprocessed_jobs()` | Returns titles of jobs with `tagTileStatus: "NEEDS_SHORTENING"` |
| `save_fixed_tags(job_title, tags)` | Updates a job with proposed tags, sets status to `"PENDING_REVIEW"` |
| `get_resumes_for_matching()` | Returns unmatched resumes (`matched: False`) |
| `save_match_results(resume_id, matches)` | Saves match results, sets `matched: True` |

## LLM Tools (`llm_tool.py`)

| Tool | Description |
|------|-------------|
| `rewrite_tags(text)` | Uses Gemini to rewrite messy tags into clean keywords |
| `verify_tags(tags)` | Uses Gemini to validate tags or detect hallucinations |
| `llm` | Exported `ChatGoogleGenerativeAI` instance for direct use |

## Parser Tool (`parser_tool.py`)

| Tool | Description |
|------|-------------|
| `parse_resume(text)` | Extracts skills and domains from resume text using Gemini LLM, with regex fallback |

## Vector Tool (`vector_tool.py`)

| Tool | Description |
|------|-------------|
| `semantic_job_search(query)` | LlamaIndex-based vector similarity search across jobs |

The vector index is built dynamically when documents are loaded.
