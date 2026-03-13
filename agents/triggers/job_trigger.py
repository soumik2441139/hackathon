import time

from agents.crew.db.mongo import jobs_col
from agents.queue.jobs import enqueue_task
from agents.tasks.scan_tasks import scan_job_tags


def watch_new_jobs():
    print("Listening for new Job inserts via Change Streams...")
    while True:
        try:
            with jobs_col.watch() as stream:
                for change in stream:
                    if change.get("operationType") == "insert":
                        job = change.get("fullDocument")
                        if job:
                            enqueue_task(scan_job_tags, job)
        except Exception as exc:
            print(f"[Trigger:jobs] Change stream interrupted: {exc}. Retrying in 5s...")
            time.sleep(5)
