from pymongo import MongoClient
import os

# Support both MONGODB_URI (backend standard) and MONGO_URI (legacy) env var names
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["opushire"]

jobs_col = db["jobs"]
resumes_col = db["resumes"]
memory_col = db["agent_memory"]
