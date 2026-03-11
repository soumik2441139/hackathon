from rq import Retry
from agents.queue.redis_conn import task_queue

def enqueue_task(func, *args):
    task_queue.enqueue(
        func,
        *args,
        retry=Retry(max=3, interval=[10, 30, 60]),
        failure_ttl=86400
    )
