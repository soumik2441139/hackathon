import { Options, ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

/**
 * Standardizes IP extraction by stripping the port number if present.
 * express-rate-limit's default validator can fail on "IP:Port" strings often seen in proxy setups.
 */
export const getCleanIp = (req: Request): string => {
    const rawIp = req.ip || req.socket.remoteAddress || 'unknown';
    // Remove IPv4 port (e.g., 1.2.3.4:5678 -> 1.2.3.4)
    // and handle IPv6 wrapped in brackets if necessary.
    return rawIp.split(':').length > 2 ? rawIp : rawIp.split(':')[0];
};

/**
 * Base configuration for rate limiters to ensure consistency.
 */
export const baseRateLimitConfig: Partial<Options> = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(getCleanIp(req)),
    validate: {
        xForwardedForHeader: false,
        ip: false, // Disabling strict IP validation because Azure/Proxies often append ports or unusual formats.
    },
};
