# 🧹 Cleanup Bot

**Role:** Record Rotation & Data Hygiene Agent

Manages automatic time-based archival and deletion of stale job postings.

## Two-Tier Rotation Logic

```
Now ─────── 1 week ago ─────── 3 weeks ago ──────→
  [ACTIVE]    [ARCHIVE]         [HARD DELETE]
```

| Age | Action |
|-----|--------|
| **> 1 week** (not archived) | Sets `isArchived: true` — removed from main feed but retained |
| **> 3 weeks** | Hard deletes the job AND removes it from all students' `savedJobs` arrays |

## Cascading Cleanup

When a job is hard-deleted, the bot also runs:
```js
Student.updateMany({}, { $pull: { savedJobs: jobId } })
```
This prevents orphaned references in student profiles.

## Polling

Runs every **60 seconds**.

## Files

- `cleanup.js` — Main bot logic
- `log.txt` — Runtime log output
