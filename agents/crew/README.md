# 🎭 CrewAI Core

This directory contains the **agent definitions, task definitions, and the crew orchestrator** that powers the AI pipeline.

## Agents (`agents.py`)

6 agents, all powered by **Gemini 1.5 Pro** with MongoDB-backed persistent memory:

| Agent | Role | Tools |
|-------|------|-------|
| **Recruiter** | Data Acquisition | None (future) |
| **Scanner** | Data Quality Detection | `get_unprocessed_jobs()` |
| **Fixer** | Content Repair | `rewrite_tags()`, `save_fixed_tags()` |
| **Supervisor** | QA / Hallucination Check | `verify_tags()` |
| **Matcher** | Semantic Job Matching | `semantic_job_search()`, `parse_resume()`, `get_resumes_for_matching()`, `save_match_results()` |
| **Advisor** | Career Guidance | None (reasoning-only) |

## Tasks (`tasks.py`)

| Task | Agent | Description |
|------|-------|-------------|
| `scan_task` | Scanner | Find jobs with messy tags |
| `fix_task` | Fixer | Rewrite tags to clean keywords |
| `qa_task` | Supervisor | Verify tags aren't hallucinated |
| `match_task` | Matcher | Match resumes to jobs |
| `advise_task` | Advisor | Generate skill gap + learning path |

## Orchestration (`run.py`)

```python
crew = Crew(
    agents=[recruiter, scanner, fixer, supervisor, matcher, advisor],
    tasks=[scan_task, fix_task, qa_task, match_task, advise_task],
    verbose=True
)
crew.kickoff()
```

Tasks execute **sequentially** — each agent's output feeds the next.
