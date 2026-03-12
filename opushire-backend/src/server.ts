import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import linkedinRoutes from './routes/linkedin.routes';
import fileRoutes from './routes/file.routes';
import { registerGlobalEvents } from './events/registerEvents';
import { geminiBreaker, groqBreaker } from './utils/circuitBreaker';
import { mongoSanitize } from './middleware/sanitize';
import { isEmailVerificationConfigured } from './services/email.service';

// BullMQ Workers — initialized lazily after Redis probe
import { initWorkers } from './services/queue/workers';
import { probeRedis } from './services/queue/queue.service';

const app = express();

// Trust the first proxy (Azure App Service)
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet());
app.use(cors(corsOptions));

// Rate Limiting (Global)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // Limit body payload to 10kb against DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize); // MongoDB injection protection (Express 5-compatible)

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
    const redisUp = await probeRedis();
    res.json({
        status: 'ok',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        redis: redisUp ? 'connected' : 'unavailable',
        email: isEmailVerificationConfigured() ? 'configured' : 'unconfigured',
        circuits: {
            gemini: geminiBreaker.getState(),
            groq: groqBreaker.getState(),
        },
    });
});

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
app.use('/api/linkedin', linkedinRoutes);
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
    app.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, `Opushire API running on http://localhost:${env.PORT}`);
    });
    // Connect to DB in background (auto-retries)
    connectDB();
    // Probe Redis & start BullMQ workers (non-blocking — API works without Redis)
    initWorkers().catch((err) => logger.error({ err }, 'BullMQ worker init failed'));
    // Start the autonomous bot scheduler
    initScheduler();
};

start().catch(console.error);

export default app;
