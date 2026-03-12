# 🛣️ Routes

Express route definitions. Each file registers endpoints under its base path.

| File | Base | Middleware |
|------|------|-----------|
| `auth.routes.ts` | `/api/auth` | Rate limited (10 req/10min) |
| `job.routes.ts` | `/api/jobs` | Public GET, Admin-only POST/PUT/DELETE |
| `application.routes.ts` | `/api/applications` | Authenticated |
| `admin.routes.ts` | `/api/admin` | Admin role required |
| `bot.routes.ts` | `/api/admin/bots` | Admin role required |
| `botStat.routes.ts` | `/api/admin/bot-stats` | Admin role required |
| `report.routes.ts` | `/api/admin/reports` | Admin role required |
| `resume.routes.ts` | `/api/resume` | Authenticated + multer upload |
| `resumeScore.routes.ts` | `/api/resume-score` | Authenticated |
| `match.routes.ts` | `/api/match` | Authenticated |
| `careerAdvisor.routes.ts` | `/api/career-advisor` | Authenticated |
| `linkedin.routes.ts` | `/api/linkedin` | Authenticated |
| `file.routes.ts` | `/api/files` | Authenticated |

All routes are registered in `server.ts`.
