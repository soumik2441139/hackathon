# Recruiter Bot

OpusHire's automated job fetcher — pulls internship & junior-level jobs from external APIs and stores them directly in the shared MongoDB `jobs` collection.

## Quick Start

```bash
cd recruiter-bot
npm install
# Copy and fill in your MongoDB URI
cp .env.example .env
# Edit .env with your MONGODB_URI

# Option 1: Run with built-in dashboard
npm run dev
# Open http://localhost:5001

# Option 2: One-off CLI fetch
npm run fetch
```

## Architecture

```
recruiter-bot/
├── src/
│   ├── models/Job.ts          # Job model (writes to same 'jobs' collection)
│   ├── providers/
│   │   ├── remotive.provider.ts   # 🟢 Free, no key needed
│   │   ├── arbeitnow.provider.ts  # 🟢 Free, no key needed
│   │   └── adzuna.provider.ts     # 🟡 Needs API key (Phase 2)
│   ├── bot.service.ts         # Orchestrator: fetch → deduplicate → store
│   ├── server.ts              # Express server + built-in dashboard
│   └── cli.ts                 # CLI tool for one-off fetches
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Built-in dashboard UI |
| GET | `/api/status` | Bot status & job counts |
| POST | `/api/fetch` | Trigger a new fetch cycle |
| GET | `/api/jobs` | List bot-fetched jobs |

## Providers

- **Remotive**: Remote tech jobs (free, no API key)
- **Arbeitnow**: Tech jobs worldwide (free, no API key)
- **Adzuna**: Phase 2 — set `ADZUNA_APP_ID` and `ADZUNA_API_KEY` in `.env`
