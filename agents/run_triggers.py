import agents.windows_patch
import threading
from agents.triggers.job_trigger import watch_new_jobs
from agents.triggers.resume_trigger import watch_new_resumes

if __name__ == "__main__":
    t1 = threading.Thread(target=watch_new_jobs)
    t2 = threading.Thread(target=watch_new_resumes)

    print("Booting Real-time Agent Triggers...")
    t1.start()
    t2.start()

    try:
        t1.join()
        t2.join()
    except KeyboardInterrupt:
        print("Shutting down triggers...")
