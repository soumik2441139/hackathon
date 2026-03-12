# 🔍 Scanner Bot

**Role:** Data Quality Detection Agent

Continuously monitors the jobs database and flags postings with messy, overly long, or malformed tags.

## How It Works

1. Queries jobs where `tagTileStatus` is NOT `VETTED`, `NEEDS_SHORTENING`, `FAILED`, or `READY_TO_APPLY`
2. Checks each job's tags against quality rules:
   - Tag longer than **25 characters** → flagged
   - Tag with more than **3 words** → flagged
3. Updates flagged jobs to `tagTileStatus: "NEEDS_SHORTENING"` with the `longTagsToFix` array
4. Logs metrics to `botstats` and `botreports` collections

## Polling

Runs every **30 seconds**. Supports `--single-run` flag for one-shot execution.

## Files

- `scan.js` — Main bot logic
- `mismatched_jobs.json` — Debug dump of flagged job data
- `log.txt` — Runtime log output
