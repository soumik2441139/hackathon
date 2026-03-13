<div align="center">
  <h1>🤖 Recruiter Bot</h1>
  <p><strong>OpusHire's Autonomous Job Fetcher</strong></p>
  <p>Pulls internship & junior-level jobs from 4 external sources and stores them in the shared MongoDB <code>jobs</code> collection.</p>

  [![Remotive](https://img.shields.io/badge/Remotive-Free-34d399?style=flat-square)](#)
  [![Arbeitnow](https://img.shields.io/badge/Arbeitnow-Free-22d3ee?style=flat-square)](#)
  [![Adzuna](https://img.shields.io/badge/Adzuna-API_Key-fbbf24?style=flat-square)](#)
  [![Telegram](https://img.shields.io/badge/Telegram-Scraper-a78bfa?style=flat-square)](#)
</div>

---

## 🏗 Architecture Overview

```mermaid
graph TD
    subgraph Providers["Data Providers"]
        R["🟢 Remotive API<br/>Remote tech jobs"]
        A["🟢 Arbeitnow API<br/>Tech jobs worldwide"]
        Z["🟡 Adzuna API<br/>India / UK / US"]
        T["🔵 Telegram<br/>Public channel scraper"]
    end

    subgraph Bot["Bot Engine"]
        Fetch["Fetch from all<br/>providers in parallel"]
        Filter["Filter for Junior<br/>Intern / Entry-level"]
        Dedup["Deduplicate by<br/>externalId"]
        Store["Store in MongoDB"]
    end

    subgraph Output["Output"]
        DB[("MongoDB Atlas<br/>jobs collection")]
        Dashboard["Built-in Dashboard<br/>localhost:5001"]
        OpusHire["OpusHire /jobs page"]
    end

    R --> Fetch
    A --> Fetch
    Z --> Fetch
    T --> Fetch
    Fetch --> Filter
    Filter --> Dedup
    Dedup --> Store
    Store --> DB
    DB --> Dashboard
    DB --> OpusHire
```

---

## 🔄 Data Flow — What Happens When You Click "Fetch"

```mermaid
sequenceDiagram
    participant U as Admin User
    participant S as Bot Server
    participant R as Remotive API
    participant A as Arbeitnow API
    participant Z as Adzuna API
    participant T as Telegram (Web)
    participant DB as MongoDB

    U->>S: POST /api/fetch
    
    par Parallel Fetch
        S->>R: GET /api/remote-jobs
        R-->>S: 100 remote jobs
        S->>A: GET /api/job-board-api (2 pages)
        A-->>S: ~100 jobs
        S->>Z: GET /v1/api/jobs/{country}/search (15 calls)
        Z-->>S: ~200 jobs
        S->>T: GET t.me/s/{channel} (5 channels)
        T-->>S: HTML with posts
    end

    S->>S: Filter for junior keywords
    S->>S: Normalize to Job schema
    
    loop For each job
        S->>DB: EXISTS by externalId?
        alt New Job
            S->>DB: INSERT into jobs collection
        else Duplicate
            S->>S: Skip
        end
    end
    
    S-->>U: Summary (new / duplicates / errors)
```

---

## 📦 Provider Details

### Phase 1: Remotive + Arbeitnow (Free, No API Key)

```mermaid
graph LR
    subgraph Remotive
        R1["GET remotive.com/api/remote-jobs"] --> R2["Receive ~100 jobs"]
        R2 --> R3["Filter: title/description<br/>contains junior keywords"]
        R3 --> R4["~10-30 junior jobs"]
    end

    subgraph Arbeitnow
        A1["GET arbeitnow.com/api/job-board-api<br/>(pages 1-2)"] --> A2["Receive ~100 jobs"]
        A2 --> A3["Filter: title/description<br/>contains junior keywords"]
        A3 --> A4["~5-20 junior jobs"]
    end
```

**Junior Keywords Filter:**
`intern`, `internship`, `junior`, `entry-level`, `graduate`, `fresher`, `trainee`, `associate`, `apprentice`, `beginner`, `new grad`

---

### Phase 2: Adzuna (API Key Required)

```mermaid
graph TD
    subgraph Countries["Countries Searched"]
        IN["🇮🇳 India"]
        GB["🇬🇧 UK"]
        US["🇺🇸 USA"]
    end

    subgraph Queries["Search Queries (per country)"]
        Q1["internship software"]
        Q2["junior developer"]
        Q3["entry level engineer"]
        Q4["graduate software"]
        Q5["fresher developer"]
    end

    IN --> Q1 & Q2 & Q3 & Q4 & Q5
    GB --> Q1 & Q2 & Q3 & Q4 & Q5
    US --> Q1 & Q2 & Q3 & Q4 & Q5

    Q1 & Q2 & Q3 & Q4 & Q5 --> Result["3 × 5 = 15 API calls<br/>~300 results → filtered to ~50 junior jobs"]
```

**Rate Limits (Trial Access):** 250 requests/month, 10 requests/minute

---

### Phase 3: Telegram (Public Channel Scraper)

```mermaid
graph TD
    subgraph Channels["Default Channels"]
        C1["@internshala_jobs"]
        C2["@freshabordjobs"]
        C3["@jobs_and_internships"]
        C4["@remote_jobs_feed"]
        C5["@workintech"]
    end

    subgraph Scraper["Scraper Engine"]
        Fetch["GET t.me/s/{channel}"]
        Parse["Parse HTML for message blocks"]
        Detect["Is it a job post?<br/>(keyword matching)"]
        Extract["Extract fields via regex:<br/>Title, Company, Location,<br/>Apply Link"]
    end

    C1 & C2 & C3 & C4 & C5 --> Fetch
    Fetch --> Parse
    Parse --> Detect
    Detect -->|Yes| Extract
    Detect -->|No| Skip["Skip message"]
    Extract --> Normalize["Normalize to Job schema"]
```

**How extraction works:**
| Field | Regex Pattern |
|-------|--------------|
| Title | `hiring\|opening\|vacancy\|role` followed by text |
| Company | `company\|org\|at` followed by text, or 🏢 emoji |
| Location | `location\|place\|city` followed by text, or 📍 emoji |
| Apply Link | First URL found in the post |
| Mode | Contains `remote\|wfh\|hybrid` keywords |

---

## 🔑 Deduplication System

```mermaid
graph LR
    Job["New Job"] --> ID["Generate externalId"]
    ID --> Check{"Exists in DB?"}
    Check -->|"remotive_12345"| Skip["Skip (duplicate)"]
    Check -->|"Not found"| Insert["INSERT into jobs"]
    
    style Skip fill:#f87171,color:#000
    style Insert fill:#34d399,color:#000
```

Each provider generates a unique `externalId`:
- Remotive: `remotive_{api_id}`
- Arbeitnow: `arbeitnow_{slug}`
- Adzuna: `adzuna_{api_id}`
- Telegram: `telegram_{channel}_{content_hash}`

---

## 🚀 Quick Start

```bash
cd recruiter-bot
npm install
cp .env.example .env
# Edit .env → set MONGODB_URI (same as your OpusHire backend)
```

### Option 1: Dashboard (Web UI)
```bash
npm run dev
# Open http://localhost:5001
# Click "Fetch New Jobs" button
```

### Option 2: CLI (One-Off)
```bash
npm run fetch
# Prints results to terminal and exits
```

### Option 3: Build for Production
```bash
npm run build
npm start
```

---

## ⚙️ Configuration

| Env Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | Same MongoDB as OpusHire backend |
| `PORT` | ❌ | Server port (default: 5001) |
| `RECRUITER_BOT_ADMIN_KEY` | ✅ (for remote access) | Required for non-loopback API calls via `x-bot-admin-key` |
| `ADZUNA_APP_ID` | ❌ | Adzuna Application ID |
| `ADZUNA_API_KEY` | ❌ | Adzuna API Key |
| `TELEGRAM_CHANNELS` | ❌ | Comma-separated channel names (overrides defaults) |

---

## 📊 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Built-in dashboard UI (public shell; prompts for key remotely) |
| `GET` | `/api/status` | Bot status, last run time, stats per source (requires `x-bot-admin-key` remotely) |
| `POST` | `/api/fetch` | Trigger a new fetch cycle (requires `x-bot-admin-key` remotely) |
| `GET` | `/api/jobs` | List bot-fetched jobs (requires `x-bot-admin-key` remotely) |

Remote API example:

```bash
curl -H "x-bot-admin-key: YOUR_KEY" http://<host>:5001/api/status
```

---

## 📁 File Structure

```
recruiter-bot/
├── src/
│   ├── models/
│   │   └── Job.ts                  ← Mongoose schema (same collection as OpusHire)
│   ├── providers/
│   │   ├── remotive.provider.ts    ← Phase 1 — Remote tech jobs
│   │   ├── arbeitnow.provider.ts   ← Phase 1 — Global tech jobs
│   │   ├── adzuna.provider.ts      ← Phase 2 — Multi-country search
│   │   └── telegram.provider.ts    ← Phase 3 — Channel scraper
│   ├── bot.service.ts              ← Orchestrator (fetch → filter → dedup → store)
│   ├── server.ts                   ← Express server + built-in HTML dashboard
│   └── cli.ts                      ← CLI tool for cron/manual runs
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```
