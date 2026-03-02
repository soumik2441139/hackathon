import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start
const start = async () => {
    // Start HTTP server immediately — don't block on DB
    app.listen(env.PORT, () => {
        console.log(`🚀 Opushire API running on http://localhost:${env.PORT}`);
        console.log(`🌍 Environment: ${env.NODE_ENV}`);
    });
    // Connect to DB in background (auto-retries)
    connectDB();
};

start().catch(console.error);

export default app;
