# 🧠 Agent Memory System

Persistent memory layer that allows agents to retain context across runs.

## Persistent Memory (`persistent_memory.py`)

MongoDB-backed key-value store per agent:

| Method | Description |
|--------|-------------|
| `remember(agent, key, value)` | Upsert a key-value pair with timestamp |
| `recall(agent, key)` | Retrieve a stored value |
| `append(agent, key, value)` | Push to an array field |

Stored as: `{ agent, key, value, updatedAt }`

## Shared Memory (`shared_memory.py`)

`MongoMemory` — A Pydantic BaseModel that integrates with CrewAI's memory interface:

- `load_memory_variables()` → Recalls agent's `"history"` from MongoDB
- `save_context(inputs, outputs)` → Appends conversation tuples to history
- Each agent gets its own instance keyed by `agent_name`

This allows agents to remember what they did in previous pipeline runs.
