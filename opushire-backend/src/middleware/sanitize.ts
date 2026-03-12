import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips keys starting with '$' or containing '.' from objects.
 * This prevents MongoDB operator injection attacks (e.g. { "$gt": "" }).
 */
function sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>)) {
            // Drop keys that start with $ or contain . (MongoDB operators/path injection)
            if (!key.startsWith('$') && !key.includes('.')) {
                sanitized[key] = sanitizeValue((value as Record<string, unknown>)[key]);
            }
        }
        return sanitized;
    }
    return value;
}

/**
 * Express 5-compatible MongoDB sanitization middleware.
 *
 * express-mongo-sanitize v2 crashes on Express 5 because req.query is a
 * read-only getter and cannot be reassigned. This middleware sanitizes
 * req.body and req.params (reassignable) and mutates req.query values
 * in-place without replacing the object reference.
 */
export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
    // Sanitize body (replaces entire object — safe in Express 5)
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }

    // Sanitize params (replaces entire object — safe in Express 5)
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params) as Record<string, string>;
    }

    // req.query is read-only in Express 5 — mutate values in-place only
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            const val = req.query[key];
            if (typeof val === 'string' && (val.startsWith('$') || val.includes('.'))) {
                (req.query as Record<string, unknown>)[key] = '';
            }
        }
    }

    next();
}
