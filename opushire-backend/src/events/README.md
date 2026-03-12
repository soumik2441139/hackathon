# 📡 Event System

Internal event bus for decoupled communication between services.

| File | Purpose |
|------|---------|
| `eventBus.ts` | Node.js EventEmitter-based pub/sub bus |
| `registerEvents.ts` | Registers event listeners on server startup |

Used for triggering side effects (e.g., auto-embedding jobs on creation) without coupling services directly.
