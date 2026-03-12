# 🔗 LinkedIn Enricher Bot

**Role:** Profile Enrichment via LinkedIn Scraping

Scrapes public LinkedIn profiles to extract certifications and headlines, enriching candidate resume data.

## How It Works

1. Iterates all resumes with an `extraData.linkedin` URL
2. Skips profiles enriched within the last **7 days** (cooldown)
3. Scrapes the public LinkedIn profile page with Cheerio:
   - Extracts certifications from DOM sections and JSON-LD structured data
   - Extracts headline text
4. Merges new certifications with existing ones (deduplicated)
5. Saves `lastLinkedInEnrich` timestamp to prevent re-processing
6. Rate-limits at **2 seconds between profiles**

## Polling

Runs immediately on startup, then every **30 minutes**.

## Files

- `enrich.ts` — TypeScript bot entry point

## Upstream Service

Uses `extractLinkedInProfile()` from `opushire-backend/src/services/enrichment/linkedin.service.ts`.
