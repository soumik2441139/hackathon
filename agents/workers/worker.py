from rq import Worker
from agents.queue.redis_conn import redis_conn

if __name__ == "__main__":
    worker = Worker(["agents"], connection=redis_conn)
    worker.work()
