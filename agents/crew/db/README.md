# 🗄️ Database Layer

MongoDB connection configuration for the Python agents.

## Connection (`mongo.py`)

```python
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
db = client["opushire"]
```

## Collections

| Variable | Collection | Used For |
|----------|-----------|----------|
| `jobs_col` | `jobs` | Tag status updates, unprocessed job queries |
| `resumes_col` | `resumes` | Match results, resume parsing |
| `memory_col` | `memory` | Agent persistent memory storage |

All collections are shared with the Node.js backend — the same `opushire` database.
