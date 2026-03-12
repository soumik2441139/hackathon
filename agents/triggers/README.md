# 📡 MongoDB Change Stream Triggers

Real-time event listeners that watch MongoDB for new documents and enqueue processing tasks.

## `job_trigger.py` — `watch_new_jobs()`

- Watches the `jobs` collection for **insert** operations via MongoDB Change Streams
- On new job → `enqueue_task(scan_job_tags, job)`
- Runs indefinitely as a background daemon thread

## `resume_trigger.py` — `watch_new_resumes()`

- Watches the `resumes` collection for **insert** operations
- On new resume → `enqueue_task(match_resume, resume)`
- Runs indefinitely as a background daemon thread

## Orchestration

Both triggers are launched from `agents/run_triggers.py`:

```python
t1 = threading.Thread(target=watch_new_jobs, daemon=True)
t2 = threading.Thread(target=watch_new_resumes, daemon=True)
```

**Note:** MongoDB Change Streams require a replica set or sharded cluster.
