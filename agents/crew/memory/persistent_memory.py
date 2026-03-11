from agents.crew.db.mongo import memory_col
from datetime import datetime

class PersistentMemory:

    @staticmethod
    def remember(agent, key, value):
        memory_col.update_one(
            {"agent": agent, "key": key},
            {"$set": {
                "value": value,
                "updatedAt": datetime.utcnow()
            }},
            upsert=True
        )

    @staticmethod
    def recall(agent, key):
        m = memory_col.find_one({"agent": agent, "key": key})
        return m["value"] if m else None

    @staticmethod
    def append(agent, key, value):
        memory_col.update_one(
            {"agent": agent, "key": key},
            {"$push": {"value": value}},
            upsert=True
        )
