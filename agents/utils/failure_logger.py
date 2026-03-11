from datetime import datetime
from agents.crew.db.mongo import db

failures = db["agent_failures"]

def log_failure(agent, error, payload):
    failures.insert_one({
        "agent": agent,
        "error": str(error),
        "payload": payload,
        "time": datetime.utcnow()
    })

def safe_run(agent_name, fn, payload):
    try:
        return fn(payload)
    except Exception as e:
        log_failure(agent_name, e, payload)
        raise e
