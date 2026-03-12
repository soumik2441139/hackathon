# 🛡️ Middleware

Request processing middleware stack.

| Middleware | File | Purpose |
|-----------|------|---------|
| **authenticate** | `auth.middleware.ts` | Validates JWT bearer token, extracts `userId` and `role` |
| **requireRole** | `role.middleware.ts` | Enforces role-based access (`admin`, `student`) |
| **validate** | `validate.ts` | Zod schema validation on request body/query/params |
| **errorHandler** | `errorHandler.ts` | Global error handler — formats errors, handles ZodError |
| **geoBlock** | `geoBlock.ts` | IP geolocation filter (allows only `IN`, `US`) |
| **upload** | `uploadResume.ts` | Multer config for resume PDF uploads to `uploads/` |

## Auth Flow

```
Request → Bearer token extraction → JWT verify → User lookup (students/admins) → req.user populated
```

## Rate Limiting

- **Global:** 100 requests / 15 minutes per IP
- **Auth routes:** 10 requests / 10 minutes per IP
