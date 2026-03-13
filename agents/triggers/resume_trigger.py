import time

from agents.crew.db.mongo import resumes_col
from agents.queue.jobs import enqueue_task
from agents.tasks.match_tasks import match_resume


def watch_new_resumes():
    print("Listening for new Resume inserts via Change Streams...")
    while True:
        try:
            with resumes_col.watch() as stream:
                for change in stream:
                    if change.get("operationType") == "insert":
                        resume = change.get("fullDocument")
                        if resume:
                            enqueue_task(match_resume, resume)
        except Exception as exc:
            print(f"[Trigger:resumes] Change stream interrupted: {exc}. Retrying in 5s...")
            time.sleep(5)
