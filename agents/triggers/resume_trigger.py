from agents.crew.db.mongo import resumes_col
from agents.queue.jobs import enqueue_task
from agents.tasks.match_tasks import match_resume

def watch_new_resumes():
    print("Listening for new Resume inserts via Change Streams...")
    with resumes_col.watch() as stream:
        for change in stream:
            if change["operationType"] == "insert":
                resume = change["fullDocument"]
                enqueue_task(match_resume, resume)
