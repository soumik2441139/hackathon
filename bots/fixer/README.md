# 🔧 Fixer Bot

**Role:** AI Content Repair Agent  
**LLM:** Google Gemini 2.5 Flash

Takes jobs flagged by the Scanner and uses Gemini to rewrite messy tags into clean, concise keywords.

## How It Works

1. Finds jobs with `tagTileStatus: "NEEDS_SHORTENING"`
2. Sends long tags to Gemini with prompt: _"Extract exactly 3 concise keywords (max 2 words each)"_
3. Merges existing short tags with new AI-generated ones
4. Updates job to `tagTileStatus: "PENDING_REVIEW"` with `proposedTags`
5. On failure → sets `tagTileStatus: "FAILED"`

## Polling

Runs every **15 seconds** in continuous mode, with **2-second delay** between jobs.

## Files

- `fix.js` — Main bot logic with Gemini API integration
- `log.txt` — Runtime log output

## Environment

Requires `GEMINI_API_KEY` in env.
