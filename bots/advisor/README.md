# 🎓 Advisor Bot

**Role:** Career Path & Skill Gap Analyst

Analyzes matched resumes and generates personalized learning paths based on the gap between a candidate's skills and their top matched job's requirements.

## How It Works

1. Finds resumes where `matched: true` AND `extraData.learningPath` doesn't exist
2. Calls the backend's `generateCareerInsights(resume)` service
3. Populates:
   - `extraData.skillGaps` — Skills the candidate is missing
   - `extraData.learningPath` — Array of `{ skill, steps: [step1, step2, step3] }`

## Polling

Runs immediately on startup, then every **10 minutes**.

## Files

- `advise.ts` — TypeScript bot entry point
