# 🤖 Autonomous Micro-Agent Swarm

This directory houses **8 independent AI bots** that autonomously maintain data quality, match candidates, and enrich profiles — all without human intervention.

## Architecture

The bots form a **chained data pipeline** where each stage feeds into the next:

```
[Scanner] → [Fixer] → [Supervisor] → [Admin Dashboard]
                                          ↓
[Cleanup] ←→ [Archiver]              [VETTED Jobs]
[Matcher] → [Advisor] → [LinkedIn Enricher]
```

## Bot Registry

| Bot | Directory | Language | LLM | Polling | Purpose |
|-----|-----------|----------|-----|---------|---------|
| **Scanner** | `scanner/` | JS | None | 30s | Flags jobs with messy/long tags |
| **Fixer** | `fixer/` | JS | Gemini 2.5 Flash | 15s | Rewrites bad tags into 3 clean keywords |
| **Supervisor** | `supervisor/` | JS | Groq Llama-3.3 70B | 20s | QA — detects hallucinated tags |
| **Cleanup** | `cleanup/` | JS | None | 60s | Archives >1 week, deletes >3 weeks |
| **Archiver** | `archiver/` | JS | Groq + Puppeteer | 60s | Detects dead/ghost job URLs |
| **Matcher** | `matcher/` | TS | Backend service | 60s | Matches resumes to jobs via FAISS |
| **Advisor** | `advisor/` | TS | Backend service | 10m | Generates skill gaps & learning paths |
| **LinkedIn Enricher** | `linkedin-enricher/` | TS | None | 30m | Scrapes certifications from LinkedIn |

## Tag Status State Machine

```
Job Created → OK
     ↓ (Scanner detects bad tags)
NEEDS_SHORTENING
     ↓ (Fixer rewrites via Gemini)
PENDING_REVIEW
     ↓ (Supervisor verifies via Groq)
   ┌──────────────────┐
   │  YES (approved)  │ → READY_TO_APPLY → Admin approves → VETTED
   │  NO  (rejected)  │ → back to NEEDS_SHORTENING (retry loop)
   └──────────────────┘
```

## Running Bots

```bash
# Run all JS bots via the backend pipeline (recommended)
node run-pipeline.js

# Run TS bots (matcher, advisor, enricher, recruiter)
node start-bots.js

# Preview standalone TS bot launch commands without starting them
node start-bots.js --dry-run

# Run a single bot in one-shot mode
node bots/scanner/scan.js --single-run
```

## MongoDB Collections Used

- **jobs** — Read/write by all bots (tags, status, archive flags)
- **students** — Updated by Cleanup (removes savedJobs for deleted jobs)
- **resumes** — Read/write by Matcher, Advisor, LinkedIn Enricher
- **botstats** — Daily counters written by Scanner, Fixer, Supervisor
- **botreports** — Per-bot action logs (TTL: 8 days)

## Environment Variables

All bots read from `opushire-backend/.env`:

| Variable | Used By |
|----------|---------|
| `MONGODB_URI` | All bots |
| `GEMINI_API_KEY` | Fixer |
| `GROQ_API_KEY` | Supervisor, Archiver |
