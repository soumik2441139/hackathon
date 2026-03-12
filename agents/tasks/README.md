# 📋 Task Functions

These functions are enqueued by triggers and executed by the RQ worker.

## `scan_tasks.py` — `scan_job_tags(job)`

Receives a job document from the job trigger. Creates a focused CrewAI Crew with Scanner → Fixer → Supervisor agents and runs the tag-quality pipeline. Failures are logged via `failure_logger`.

## `match_tasks.py` — `match_resume(resume)`

Receives a resume document from the resume trigger. Creates a CrewAI Crew with Matcher → Advisor agents and runs the resume-matching + career-advice pipeline. Failures are logged via `failure_logger`.
