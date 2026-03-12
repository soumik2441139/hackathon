# 🌐 FreeAPI Integration

Proxy layer for [FreeAPI](https://freeapi.app/) social features.

| File | Purpose |
|------|---------|
| `freeapi.client.ts` | Axios client configured for FreeAPI base URL |
| `auth.service.ts` | Shadow account creation, token management, avatar/cover uploads |
| `social.service.ts` | Save/unsave jobs, social interactions |
| `chat.service.ts` | Real-time messaging (create chats, send messages) |
| `freeapi.controller.ts` | Request handlers for FreeAPI routes |
| `freeapi.routes.ts` | Route definitions under `/api/freeapi` |

FreeAPI provides pre-built social features (chat, profiles) so they don't need to be built from scratch.
