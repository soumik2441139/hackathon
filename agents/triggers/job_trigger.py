from agents.crew.db.mongo import jobs_col
from agents.queue.jobs import enqueue_task
from agents.tasks.scan_tasks import scan_job_tags

def watch_new_jobs():
    print("Listening for new Job inserts via Change Streams...")
    with jobs_col.watch() as stream:
        for change in stream:
            if change["operationType"] == "insert":
                job = change["fullDocument"]
                enqueue_task(scan_job_tags, job)
