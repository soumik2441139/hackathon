# 🧠 Services

Core business logic layer. This is where all the heavy lifting happens.

## Service Map

### Core Services

| Service | Purpose |
|---------|---------|
| `auth.service.ts` | User registration, login, profile management |
| `job.service.ts` | Job CRUD with pagination, filters, full-text search |
| `application.service.ts` | Job application lifecycle |
| `admin.service.ts` | User management, system stats, pending job review |
| `bot.service.ts` | Spawns/manages bot child processes, pipeline orchestration |
| `scheduler.service.ts` | Cron-like scheduler — runs bot pipeline every 6 hours |

### AI/ML Pipeline

| Service | LLM/Tech | Purpose |
|---------|----------|---------|
| `ai/resume.parser.ts` | Gemini 1.5 Pro | Extract structured data from resume text |
| `ai/embedding.service.ts` | Gemini text-embedding-004 | Generate 768-dim vectors |
| `ai/job.matcher.ts` | Gemini | Generate match explanations |
| `ai/skill.canonicalizer.ts` | Gemini | AI-powered skill name normalization |
| `ai/gemini.client.ts` | — | Shared Gemini client instance |
| `ai-router.service.ts` | Groq → Gemini | Dual-model fallback (confidence < 85%) |
| `ai-extractor.service.ts` | Gemini | Structured data extraction |

### Matching & Ranking

| Service | Purpose |
|---------|---------|
| `matching/match.service.ts` | Qdrant search → re-rank → explain pipeline |
| `ranking/rerank.service.ts` | Score by skill overlap, domain, recency |
| `scoring/resume.score.ts` | Resume quality scoring (0-100) |
| `vector/faiss.store.ts` | Qdrant vector index with disk persistence |
| `vector/autoEmbedJob.ts` | Auto-embed new jobs on creation |
| `vector/similarity.search.ts` | Vector similarity search interface |

### Resume Processing

| Service | Purpose |
|---------|---------|
| `resume/processResume.ts` | Full pipeline: PDF → parse → normalize → score → embed |
| `advisor/careerAdvisor.service.ts` | Skill gap analysis + learning paths |

### Media & Storage

| Service | Purpose |
|---------|---------|
| `storage/blob.service.ts` | Azure Blob uploads |
| `storage/cdnSignedUrl.service.ts` | Ephemeral signed CDN URLs (10 min) |
| `storage/blobSas.service.ts` | SAS token URL generation |
| `media/pdfWatermark.service.ts` | Diagonal watermark on resume downloads |
| `media/imageOptimize.service.ts` | Image resize/compression via Sharp |
| `image.service.ts` | URL → Base64 image conversion |

### External Integrations

| Service | Purpose |
|---------|---------|
| `auto-apply.service.ts` | Puppeteer-based form auto-fill with ATS allowlist |
| `salary-estimator.service.ts` | Google search scraping + AI salary extraction |
| `enrichment/linkedin.service.ts` | LinkedIn public profile scraping |
