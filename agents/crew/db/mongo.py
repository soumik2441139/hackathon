from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["opushire"]

jobs_col = db["jobs"]
resumes_col = db["resumes"]
memory_col = db["agent_memory"]
