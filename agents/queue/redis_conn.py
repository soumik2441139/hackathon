import os
import redis
from rq import Queue


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


redis_kwargs = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": _env_int("REDIS_PORT", 6379),
    "db": _env_int("REDIS_DB", 0),
    "socket_connect_timeout": 5,
    "socket_timeout": 30,
}

password = os.getenv("REDIS_PASSWORD")
if password:
    redis_kwargs["password"] = password

if os.getenv("REDIS_TLS", "false").lower() == "true":
    redis_kwargs["ssl"] = True
    redis_kwargs["ssl_cert_reqs"] = None

redis_conn = redis.Redis(**redis_kwargs)
task_queue = Queue(os.getenv("REDIS_QUEUE", "agents"), connection=redis_conn)
