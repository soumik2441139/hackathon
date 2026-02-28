"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const cors_2 = require("./config/cors");
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const app = (0, express_1.default)();
// Security & parsing
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Logging
if (env_1.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env_1.env.NODE_ENV, timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
app.use('/api/applications', application_routes_1.default);
// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// Global error handler
app.use(errorHandler_1.errorHandler);
// Start
const start = async () => {
    // Start HTTP server immediately — don't block on DB
    app.listen(env_1.env.PORT, () => {
        console.log(`🚀 Opushire API running on http://localhost:${env_1.env.PORT}`);
        console.log(`🌍 Environment: ${env_1.env.NODE_ENV}`);
    });
    // Connect to DB in background (auto-retries)
    (0, db_1.connectDB)();
};
start().catch(console.error);
exports.default = app;
//# sourceMappingURL=server.js.map