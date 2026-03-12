# 🧠 Python Agents System (CrewAI)

This is the **Python-based multi-agent orchestration layer** built on [CrewAI](https://github.com/joaomdmoura/crewai). It provides event-driven, queue-backed AI agent workflows that complement the Node.js bots.

## Architecture

```
┌─────────────────────────────────────────┐
│         MongoDB Change Streams          │
│   (job inserts)     (resume inserts)    │
└────────┬──────────────┬─────────────────┘
         │              │
    job_trigger     resume_trigger
         │              │
         └──────┬───────┘
                │
       ┌────────▼────────┐
       │   Redis Queue   │ ← RQ (Redis Queue) with retry logic
       │   "agents"      │
       └────────┬────────┘
                │
       ┌────────▼────────┐
       │   RQ Worker     │ ← Processes tasks from queue
       └────────┬────────┘
                │
    ┌───────────┼───────────┐
    │                       │
  scan_job_tags()      match_resume()
    │                       │
    ▼                       ▼
 CrewAI Crew            CrewAI Crew
 [Scanner→Fixer→QA]    [Matcher→Advisor]
```

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `crew/` | CrewAI agent definitions, task definitions, and orchestration |
| `crew/db/` | MongoDB connection and collection references |
| `crew/memory/` | Persistent agent memory backed by MongoDB |
| `crew/tools/` | Agent tools — DB operations, LLM calls, resume parsing, vector search |
| `queue/` | Redis connection and RQ job enqueueing |
| `tasks/` | Task functions invoked by the queue worker |
| `triggers/` | MongoDB Change Stream listeners for jobs and resumes |
| `utils/` | Failure logging utilities |
| `workers/` | RQ worker process |

## Getting Started

```bash
# Install dependencies
cd agents
pip install -r requirements.txt

# Run the full CrewAI pipeline
python -m agents.crew.run

# Run MongoDB change stream triggers
python -m agents.run_triggers

# Start a queue worker
python -m agents.workers.worker
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key (used by all agents) |
| `REDIS_HOST` | Redis host (default: `localhost`) |

## Key Files

- `run_triggers.py` — Spawns 2 daemon threads watching for job/resume inserts
- `windows_patch.py` — Patches RQ multiprocessing to use `spawn` on Windows
- `requirements.txt` — Python dependencies
