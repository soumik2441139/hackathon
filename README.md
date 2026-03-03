<div align="center">
  <br />
  <h1>OpusHire 🚀</h1>
  <p><strong>Elevate your Career from Campus.</strong></p>
  <p>The premium job portal designed explicitly for high-growth students, top-tier tech startups, and autonomous AI micro-agents.</p>
  <br />

  [![Deploy on Azure](https://img.shields.io/badge/Deploy_on_Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://opushire-frontend-app-hbarc3h7ckashzhb.centralindia-01.azurewebsites.net)
  [![Frontend Tech](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
  [![Styling](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![Agents](https://img.shields.io/badge/Groq_Llama3-F55036?style=for-the-badge&logo=groq&logoColor=white)](#)
  [![Agents](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](#)

</div>

---

## 🌟 Overview

OpusHire is a modern, full-stack recruitment platform and application tracking system (ATS) crafted to seamlessly connect top-tier student talent with world-class technology companies. 

Beyond standard job portal features, OpusHire implements an **Autonomous AI Ecosystem** consisting of several micro-agents that scrape jobs, clean data using LLMs, supervise each other to prevent hallucinations, and automatically archive expired roles.

---

## 📁 Monorepo Structure

```
hackathon/
├── opushire/               ← Frontend (Next.js 14 + Tailwind v4 + Framer Motion)
├── opushire-backend/       ← Backend API (Express.js + MongoDB)
├── recruiter-bot/          ← Autonomous Job Scraper (Telegram/APIs)
├── bot1-scanner/           ← AI: Flags messy job tags 
├── bot2-fixer/             ← AI: Gemini Flash rewrites messy tags
├── bot3-supervisor/        ← AI: Groq Llama-3 QA verifies Gemini outputs
├── bot4-cleanup/           ← Core: Hard/Soft archives expired jobs
├── .github/workflows/      ← CI/CD pipelines (Azure deployment)
├── .gitignore
└── README.md
```

---

## 🗺️ User Journey

```mermaid
graph LR
    User((User)) -->|Auth| Dashboard{Role?}
    Dashboard -->|Student| S_Profile["Build Profile"]
    S_Profile --> S_Search["Search Jobs"]
    S_Search --> S_Apply["Apply for Role"]
    S_Apply --> S_Track["Track Application"]
    
    Dashboard -->|Recruiter| R_Org["Manage Org"]
    R_Org --> R_Post["Post Jobs"]
    R_Post --> R_Review["Review Applicants"]
    R_Review --> R_Status["Update Status"]
    
    Dashboard -->|Admin| A_Panel["Admin Bot Hub"]
    A_Panel --> A_Manage["Manage Bots"]
    A_Manage --> A_Logs["View Live Micro-agent Logs"]
```

---

## 🏗 System Architecture & AI Ecosystem

The architecture handles core portal logic alongside a background swarm of micro-agents deployed directly into the backend App Service.

```mermaid
graph TD
    subgraph Frontend["Frontend — Next.js 14"]
        AppRouter["App Router"]
        TW["Tailwind CSS v4"]
        FM["Framer Motion"]
        AdminDashboard["Admin AI Bot Hub"]
    end

    subgraph Backend["Backend — Express.js"]
        API["REST API (JWT)"]
        BotSpawner["Bot Process Manager"]
    end

    subgraph Database["MongoDB Atlas"]
        Jobs[(Jobs Collection)]
    end

    subgraph AI_Ecosystem["Autonomous Micro-agents"]
        Bot0["Recruiter Bot (Scraper)"]
        Bot1["Bot 1: Scanner (Detection)"]
        Bot2["Bot 2: Fixer (Gemini Flash)"]
        Bot3["Bot 3: Supervisor (Groq Llama-3)"]
        Bot4["Bot 4: Cleanup (Archival)"]
    end

    Frontend -->|"REST API"| API
    AdminDashboard -->|"Start/Stop/Logs"| BotSpawner
    BotSpawner -->|"Spawns Child Processes"| AI_Ecosystem
    API -->|"CRUD"| Jobs
    AI_Ecosystem -->|"Read/Write (poll interval)"| Jobs
    
    Bot2 -->|"LLM Call"| Gemini["Google Gemini API"]
    Bot3 -->|"LLM Call"| Groq["Groq API"]
```

---

## 🔒 The Multi-Agent Data Pipeline

OpusHire uses a chained agent architecture to ensure data quality without human intervention:

1. **Recruiter Bot**: Ingests messy, unformatted job postings from Telegram and external APIs.
2. **Scanner Bot**: Watches the DB. Flags jobs with excessively long or messy tags (`tagTileStatus: NEEDS_SHORTENING`).
3. **Fixer Bot**: Picks up flagged jobs. Uses **Gemini 1.5 Flash** to extract concise, 3-keyword summaries (`tagTileStatus: PENDING_REVIEW`).
4. **Supervisor Bot**: QA Agent. Uses **Groq Llama-3 70B** to verify Gemini's output against the original text. Overrides hallucinations and approves clean data (`tagTileStatus: VETTED`).
5. **Cleanup Bot**: Soft-archives 1-week-old jobs and hard-deletes 3-week-old jobs to keep the platform fresh.

---

## ✨ Core UI/UX Features

- **Premium Glassmorphism**: Deep dark oceanic themes with frosted glass cards (`backdrop-blur`).
- **Tactile Interactions**: Smooth, physics-based spring animations (`whileHover`, `whileTap`) using Framer Motion.
- **Real-time Bot Hub**: Admins can start, stop, and monitor live streaming stdout/stderr terminal logs from the AI swarm.
- **Audio Visualizers**: Animated bar visualizers that pulse when an AI agent is actively online and processing.

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose ODM |
| **Database** | MongoDB Atlas |
| **Agent LLMs** | Google Gemini 1.5 Flash, Groq Llama-3 70B |
| **Micro-agents** | Native Node.js `child_process` (cross-platform Linux/Win) |
| **CI/CD** | GitHub Actions (Zip-deployment strategy) |
| **Hosting** | Microsoft Azure App Service (Platform-as-a-Service) |

---

## 🚀 Live Deployments

| Service | URL |
|---------|-----|
| **Frontend Platform** | [opushire-frontend-app.azurewebsites.net](https://opushire-frontend-app-hbarc3h7ckashzhb.centralindia-01.azurewebsites.net) |
| **Backend API** | [opushire-backend-app.azurewebsites.net](https://opushire-backend-app-hbarc3h7ckashzhb.centralindia-01.azurewebsites.net/health) |

---

## 🛠 Local Development

### Prerequisites
- Node.js 20+
- MongoDB Atlas connection string
- Gemini API Key
- Groq API Key

### 1. Backend + Micro-agents
```bash
cd opushire-backend
npm install
# Create .env with: MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, GROQ_API_KEY, PORT=5000
npm run dev
```

*(Note: The backend automatically manages and spawns the bot scripts located in `bot1`, `bot2`, `bot3`, `bot4`, and `recruiter-bot` folders when triggered from the admin UI).*

### 2. Frontend
```bash
cd opushire
npm install
# Create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
# Open http://localhost:3000
```

---

> Built with 🩵 for high-growth students everywhere by **Soumik** and **Sagnik**.

