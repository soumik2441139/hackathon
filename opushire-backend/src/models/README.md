# 📦 Data Models

Mongoose schemas defining the MongoDB document structure.

## Models

| Model | Collection | Description |
|-------|-----------|-------------|
| `User.ts` | — | Base user schema (extended by Student/Admin) |
| `Student.ts` | `students` | Student users with college, degree, skills, savedJobs |
| `Admin.ts` | `admins` | Admin users with elevated privileges |
| `Job.ts` | `jobs` | Job listings with tags, status machine, source tracking |
| `Application.ts` | `applications` | Job applications (unique per user+job) |
| `Resume.ts` | `resumes` | Uploaded resumes with AI-parsed data, scores, matches |
| `BotStat.ts` | `botstats` | Daily aggregated bot metrics |
| `BotReport.ts` | `botreports` | Per-bot daily action logs (TTL: 8 days) |

## Key Design Decisions

- **Split collections by role:** Students and Admins live in separate collections for query performance
- **Tag status machine:** Jobs track `tagTileStatus` through `OK → NEEDS_SHORTENING → PENDING_REVIEW → READY_TO_APPLY → VETTED`
- **Flexible resume schema:** `extraData` is a `Map<string, any>` for AI-enriched fields (skill gaps, learning paths, certifications)
- **Full-text search index** on Job title, company, and tags
