# 👷 RQ Worker

The worker process that polls the Redis `"agents"` queue and executes enqueued tasks.

## Running

```bash
python -m agents.workers.worker
```

Processes:
- `scan_job_tags` — Tag quality pipeline (Scanner → Fixer → Supervisor)
- `match_resume` — Resume matching pipeline (Matcher → Advisor)

Handles retries automatically per the queue configuration (3 retries with backoff).
