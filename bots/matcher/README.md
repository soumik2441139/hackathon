# 🎯 Matcher Bot

**Role:** Resume-to-Job Matching Engine

Automatically matches unmatched resumes to relevant jobs using the backend's Qdrant vector search and re-ranking pipeline.

## How It Works

1. Finds resumes where `matched: false`
2. Validates that `parsedData` (skills, domains) and `rawText` exist
3. Calls the backend's `getMatches(rawText, parsedData)` service which:
   - Qdrant vector similarity search (top 20 candidates)
   - Re-ranking by skill overlap, domain match, and recency
   - Gemini-generated match explanations for top 5
4. Saves results to `resume.matches[]` and sets `matched: true`

## Polling

Runs immediately on startup, then every **60 seconds**.

## Files

- `match.ts` — TypeScript bot entry point
