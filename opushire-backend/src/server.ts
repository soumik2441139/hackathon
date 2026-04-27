import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import promBundle from 'express-prom-bundle';
import { getRateLimitConfig } from './config/rateLimit';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger, setTraceId, getTraceId } from './utils/logger';
import crypto from 'crypto';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import adminRoutes from './routes/admin.routes';
import freeapiRoutes from './freeapi/freeapi.routes';
import botRoutes from './routes/bot.routes';
import botStatRoutes from './routes/botStat.routes';
import reportRoutes from './routes/report.routes';
import { initScheduler } from './services/scheduler.service';

// AI & Job Matching Ecosystem Routes
import resumeRoutes from './routes/resume.routes';
import resumeScoreRoutes from './routes/resumeScore.routes';
import matchRoutes from './routes/match.routes';
import careerAdvisorRoutes from './routes/careerAdvisor.routes';
import fileRoutes from './routes/file.routes';

import { registerGlobalEvents } from './events/registerEvents';


import { geminiBreaker, groqBreaker } from './utils/circuitBreaker';
import { mongoSanitize } from './middleware/sanitize';
import { isEmailVerificationConfigured } from './services/email.service';

// BullMQ Workers — initialized lazily after Redis probe
import { initWorkers } from './services/queue/workers';
import { probeRedis } from './services/queue/queue.service';

// WebSockets (Real-time Streaming)
import { WebSocketService } from './services/websocket.service';

// Swagger API Docs
import swaggerUi from 'swagger-ui-express';
import { existsSync } from 'fs';
import { join } from 'path';

const app = express();
let httpServer: ReturnType<typeof app.listen> | null = null;
let shuttingDown = false;

// Trust the first proxy (Azure App Service) - Must be set before any middleware
app.set('trust proxy', 1);

// Security & parsing
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors(corsOptions));


// Rate Limiting (Global)
const limiter = rateLimit({
    ...getRateLimitConfig('global'),
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Increased from 100 to 1000 for development headroom
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // Limit body payload to 10kb against DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize); // MongoDB injection protection (Express 5-compatible)

// Prometheus Metrics Endpoint (Exposes GET /metrics)
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    promClient: {
        collectDefaultMetrics: {}
    }
});
app.use(metricsMiddleware);

// Per-request trace ID & structured HTTP logging
app.use((req, res, next) => {
    const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
    setTraceId(traceId);
    res.setHeader('x-trace-id', traceId);
    const start = Date.now();
    res.on('finish', () => {
        logger.info({
            scope: 'HTTP',
            traceId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - start,
        }, `${req.method} ${req.originalUrl} ${res.statusCode}`);
    });
    next();
});

// Health check
app.get('/', (_req, res) => {
    res.json({ status: 'alive', message: 'Opushire Backend API' });
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        email: isEmailVerificationConfigured() ? 'configured' : 'unconfigured',
    });
});

app.get('/api/health', async (_req, res) => {
    const redisStatus = await probeRedis();
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Auto-generate alerts based on infra health
    const alerts: { type: string; message: string }[] = [];
    if (!redisStatus.primary) {
        alerts.push({ type: 'critical', message: 'Primary Redis Cluster (Azure) unreachable. Job orchestration is suspended.' });
    }
    if (mongoStatus === 'disconnected') {
        alerts.push({ type: 'critical', message: 'MongoDB connection lost. User data and persistence are unavailable.' });
    }
    if (env.SECONDARY_REDIS_HOST && !redisStatus.secondary) {
        alerts.push({ type: 'warning', message: 'Secondary Redis (Upstash) degraded. AI scraping and heavy background tasks may be delayed.' });
    }

    res.json({
        status: alerts.some(a => a.type === 'critical') ? 'error' : 'ok',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        mongodb: mongoStatus,
        redis: {
            primary: redisStatus.primary ? 'connected' : 'unavailable',
            secondary: env.SECONDARY_REDIS_HOST ? (redisStatus.secondary ? 'connected' : 'unavailable') : 'not_configured',
            tertiary: env.TERTIARY_REDIS_URL ? (redisStatus.tertiary ? 'connected' : 'unavailable') : 'not_configured'
        },
        alerts,
        email: isEmailVerificationConfigured() ? 'configured' : 'unconfigured',
        circuits: {
            gemini: geminiBreaker.getState(),
            groq: groqBreaker.getState(),
        },
    });
});

// API Docs — served only if swagger-output.json has been generated (npm run swagger)
const swaggerPath = join(__dirname, '..', 'swagger-output.json');
if (existsSync(swaggerPath)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swaggerDocument = require(swaggerPath);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'OpusHire API Explorer',
        customCss: '.swagger-ui .topbar { background: #0f172a; }',
    }));
    app.get('/api/docs.json', (_req, res) => res.json(swaggerDocument));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/bots', botRoutes);
app.use('/api/admin/bot-stats', botStatRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/freeapi', freeapiRoutes);

// AI & Job Matching Ecosystem
app.use('/api/resume', resumeRoutes);
app.use('/api/resume-score', resumeScoreRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/career-advisor', careerAdvisorRoutes);
app.use('/api/files', fileRoutes);




// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start
const start = async () => {
    // Initialize standalone AI Background Event Listeners
    registerGlobalEvents();

    // Start HTTP server immediately — don't block on DB or Redis
    httpServer = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, `Opushire API running on http://localhost:${env.PORT}`);
    });

    // Mount Bidirectional WebSockets to the raw HTTP server instance
    WebSocketService.init(httpServer);

    // Connect to DB in background (auto-retries)
    connectDB();
    // Probe Redis & start BullMQ workers (non-blocking — API works without Redis)
    initWorkers().catch((err) => logger.error({ err }, 'BullMQ worker init failed'));
    // Start the autonomous bot scheduler (Hooks the startup AI pipeline and 6-hour cron loops)
    initScheduler();
};

// Start only if not imported by Jest
if (process.env.NODE_ENV !== 'test') {
    start().catch(console.error);
}

// ─── Graceful Shutdown ───────────────────────────────────────────
// Must call closeQueues() so IORedis TCP sockets are released immediately.
// Without this, Azure restarts leave ghost connections on Redis Cloud until
// the server-side TCP timeout (~5-10 min), causing max-connection breaches.
async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} received — closing Redis connections and exiting`);

    try {
        const { closeQueues } = await import('./services/queue/queue.service');
        await closeQueues();
    } catch (err) {
        logger.error({ err }, 'Error during queue shutdown');
    }

    try {
        if (httpServer) {
            await new Promise<void>((resolve, reject) => {
                httpServer!.close((err) => (err ? reject(err) : resolve()));
            });
        }
    } catch (err) {
        logger.error({ err }, 'Error while closing HTTP server');
    }

    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
        }
    } catch (err) {
        logger.error({ err }, 'Error while closing MongoDB connection');
    }

    process.exit(0);
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught Exception thrown');
    // Log and continue — Azure App Service health checks will restart
    // the process on sustained failures, avoiding unnecessary downtime
    // for transient exceptions that don't corrupt application state.
});

export default app;
