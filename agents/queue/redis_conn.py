import redis
from rq import Queue

redis_conn = redis.Redis(host="localhost", port=6379)
task_queue = Queue("agents", connection=redis_conn)
