# 🛡️ Supervisor Bot

**Role:** QA Critic / Hallucination Detector  
**LLM:** Groq Llama-3.3 70B Versatile

Verifies the Fixer's AI-generated tags against the original job description and catches hallucinations.

## How It Works

1. Finds jobs with `tagTileStatus: "PENDING_REVIEW"`
2. Sends original requirements + proposed keywords to Groq
3. Asks: _"Are these keywords accurate representations of the original? YES or NO only."_
4. **YES** → `tagTileStatus: "READY_TO_APPLY"`, saves as `verifiedTags`
5. **NO** → Reverts to `tagTileStatus: "NEEDS_SHORTENING"` for the Fixer to retry

## Why Two LLMs?

Using a **different model** (Groq) from the Fixer (Gemini) prevents the same model from validating its own output — a core anti-hallucination strategy.

## Polling

Runs every **20 seconds**.

## Files

- `supervise.js` — Main bot logic
- `log.txt` — Runtime log output

## Environment

Requires `GROQ_API_KEY` in env.
