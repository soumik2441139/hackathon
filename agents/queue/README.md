# 📮 Redis Queue

Async task queue using [RQ (Redis Queue)](https://python-rq.org/) for fault-tolerant background processing.

## Connection (`redis_conn.py`)

```python
redis_conn = redis.Redis(host="localhost", port=6379)
task_queue = Queue("agents", connection=redis_conn)
```

## Job Enqueueing (`jobs.py`)

```python
enqueue_task(func, *args)
```

Configuration:
- **3 retries** with intervals: 10s, 30s, 60s
- **24-hour failure TTL** — keeps failed job records for debugging
- Queue name: `"agents"`
