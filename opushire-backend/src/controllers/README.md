# 🎮 Controllers

Thin request handler layer — controllers parse requests and delegate to services.

| Controller | Routes | Purpose |
|-----------|--------|---------|
| `auth.controller.ts` | `/api/auth` | Register, login, get/update profile |
| `job.controller.ts` | `/api/jobs` | Job CRUD operations |
| `application.controller.ts` | `/api/applications` | Apply, list, update status |
| `admin.controller.ts` | `/api/admin` | User management, system stats, debug |
| `bot.controller.ts` | `/api/admin/bots` | Start/stop/pipeline bot management |
| `botStat.controller.ts` | `/api/admin/bot-stats` | Daily bot metrics |
| `report.controller.ts` | `/api/admin/reports` | Bot activity reports |
| `resume.controller.ts` | `/api/resume` | Resume upload + AI processing |
| `resumeScore.controller.ts` | `/api/resume-score` | Resume quality scoring |
| `match.controller.ts` | `/api/match` | Job matching results |
| `careerAdvisor.controller.ts` | `/api/career-advisor` | Skill gap analysis |
| `linkedin.controller.ts` | `/api/linkedin` | Profile enrichment |
| `file.controller.ts` | `/api/files` | Signed file download URLs |
