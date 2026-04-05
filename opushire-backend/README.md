# ⚙️ OpusHire Backend API

Express.js REST API server with JWT authentication, MongoDB, and a full AI/ML pipeline.

## Quick Start

```bash
npm install
npm run start        # Production
npm run dev          # Development (auto-restart)
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/auth` | POST, GET, PUT | Public + Protected | Register, login, profile |
| `/api/jobs` | GET, POST, PUT, DELETE | Public + Admin | Job CRUD & auto-apply |
| `/api/applications` | POST, GET, PUT | Protected | Job applications |
| `/api/resume` | POST | Protected | Resume upload (PDF) |
| `/api/resume-score` | GET | Protected | AI resume quality score |
| `/api/match` | GET | Protected | Qdrant vector job matching |
| `/api/career-advisor` | GET | Protected | Skill gap analysis |
| `/api/linkedin` | POST | Protected | Profile enrichment |
| `/api/files` | GET | Protected | Signed CDN URLs for files |
| `/api/admin` | GET, POST, DELETE | Admin | User mgmt, stats, debug |
| `/api/admin/bots` | GET, POST | Admin | Bot start/stop/pipeline/logs |
| `/api/admin/bot-stats` | GET | Admin | Daily bot statistics |
| `/api/admin/reports` | GET | Admin | Bot activity reports |
| `/api/admin/health` | GET | Admin | Tri-Redis and MongoDB deep-health probes |
| `/api/freeapi` | Various | Protected | Social features integration |

## Project Structure

```
src/
├── server.ts          ← Express app entry point
├── config/            ← DB connection, CORS, env vars
├── controllers/       ← Request handlers (thin layer)
├── routes/            ← Express route definitions
├── models/            ← Mongoose schemas (6 models)
├── services/          ← Business logic & AI pipeline
├── middleware/         ← Auth, validation, rate limiting
├── events/            ← Internal event bus
├── freeapi/           ← FreeAPI social integration
└── utils/             ← Helpers (skills, logging)
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT + bcrypt (12 rounds)
- **AI:** OpenRouter, Groq Llama-3, Google Gemini, Qdrant Vector DB (migrated from FAISS)
- **Queuing & Cache:** Triple-Redis Eco-System (BullMQ Primary, Secondary Fallback, Tertiary Caching)
- **Storage:** Azure Blob + CDN with SAS signing
- **PDF:** pdf-parse (extraction) + pdf-lib (watermarking)
- **Validation:** Zod schemas

## Environment Variables

See `.env.example` or configure:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key |
| `AZURE_STORAGE_*` | Azure Blob storage credentials |
| `FREEAPI_BASE_URL` | FreeAPI service URL |
