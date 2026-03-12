# 🔧 Utilities

Shared helper functions used across the backend.

| File | Purpose |
|------|---------|
| `skillNormalizer.ts` | 3-stage skill normalization: dictionary → rules → AI canonicalization |
| `skillDictionary.ts` | Fast regex-based skill name mapping (e.g., `js` → `JavaScript`) |
| `skillRules.ts` | Rule-based skill cleaning (title case, spacing) |
| `resumeTextExtractor.ts` | PDF text extraction via `pdf-parse` |
| `safeAsync.ts` | Express async error wrapper |
| `logger.ts` | Logging utility |
