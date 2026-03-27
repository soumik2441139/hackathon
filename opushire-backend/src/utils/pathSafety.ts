import path from 'path';
import fs from 'fs';

/**
 * Validates that the requested fullPath is strictly contained within the baseDir.
 * Prevents directory traversal attacks (e.g. ../../etc/passwd).
 */
export function assertSafePath(fullPath: string, baseDir: string): string {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(fullPath);

    if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error('Access denied: Unauthorized path traversal attempt detected.');
    }

    return resolvedPath;
}

/**
 * Resolves a filename or subpath relative to a base directory and ensures it is safe.
 */
export function resolveSafePath(baseDir: string, ...subPaths: string[]): string {
    const fullPath = path.join(baseDir, ...subPaths);
    return assertSafePath(fullPath, baseDir);
}

/**
 * Returns the basename of a path, stripped of any directory information.
 * Used for sanitizing user-provided IDs that might be used as filenames.
 */
export function sanitizeFilename(filename: string): string {
    return path.basename(filename);
}
