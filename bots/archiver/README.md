# 👻 Archiver Bot (Ghost Job Detector)

**Role:** External URL Verification Agent  
**Tech:** Puppeteer + Groq Llama-3.3 70B

Visits external job posting URLs with a headless browser to detect dead links and expired listings.

## How It Works

1. Queries active jobs with `externalUrl` not checked in the last 24 hours
2. For each job (batches of 3):
   - Launches Puppeteer with a Chrome user-agent
   - Navigates to the URL with a 20-second timeout
   - **HTTP ≥ 400** → immediately flagged as dead
   - **Page loads** → sends first 1500 chars to Groq to check for closure language
3. Groq detects phrases like _"no longer available"_, _"position filled"_, _"404"_
4. Dead jobs → `isArchived: true` with `lastUrlCheck` timestamp

## Why Puppeteer?

Many career pages are JavaScript-rendered SPAs. A simple HTTP request would get empty HTML. Puppeteer renders the full page before analysis.

## Polling

Runs every **60 seconds**, processing **3 jobs per cycle**.

## Files

- `archive.js` — Main bot logic

## Environment

Requires `GROQ_API_KEY` in env. Puppeteer auto-downloads Chromium.
