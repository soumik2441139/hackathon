# 📚 Library / Shared Utilities

Core shared modules used across all frontend pages and components.

## Files

### `api.ts` — API Client

Centralized HTTP client for all backend communication.

- **Base URL:** `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:5000/api`
- **Auth:** Auto-injects Bearer token from localStorage
- **Modules:** `auth`, `jobs`, `applications`, `admin`, `admin.bots`, `admin.reports`, `freeapi`

### `types.ts` — TypeScript Types

Shared type definitions:
- `User` (with role, skills, college, company fields)
- `Job` (with tags, salary, source, tagTileStatus)
- `Application` (with status lifecycle)
- `BotStatus`, `BotReport`, `BotStat`
- API response wrappers

### `data.ts` — Static Data

Constants and static datasets used in UI (categories, filter options, etc.)

### `utils.ts` — Utility Functions

Helper functions for formatting, date manipulation, and common operations. Includes the `cn()` classname merger utility.
