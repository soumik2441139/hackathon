"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bot_service_1 = require("./bot.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ─── API Routes ───────────────────────────────────────────────────────────────
app.get('/api/status', async (_req, res) => {
    const status = (0, bot_service_1.getBotStatus)();
    const stats = await (0, bot_service_1.getBotJobStats)();
    res.json({ success: true, data: { ...status, stats } });
});
app.post('/api/fetch', async (_req, res) => {
    try {
        const result = await (0, bot_service_1.fetchAllJobs)();
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.get('/api/jobs', async (req, res) => {
    const { BotJob } = require('./models/Job');
    const source = req.query.source;
    const query = { source: { $ne: 'manual' } };
    if (source)
        query.source = source;
    const jobs = await BotJob.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: jobs, count: jobs.length });
});
// ─── Built-in Frontend Dashboard ──────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.send(getDashboardHTML());
});
// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    }
    catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`🤖 Recruiter Bot running at http://localhost:${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}`);
        console.log(`🔗 API: http://localhost:${PORT}/api/status`);
    });
}
start();
// ─── Dashboard HTML ───────────────────────────────────────────────────────────
function getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpusHire Recruiter Bot</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.05em;
            background: linear-gradient(135deg, #a78bfa, #22d3ee);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header p { color: rgba(255,255,255,0.4); margin-top: 8px; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 999px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #22d3ee;
            margin-bottom: 16px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -0.05em;
        }
        .stat-card .label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: rgba(255,255,255,0.3);
            margin-top: 4px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border-radius: 14px;
            border: 1px solid rgba(167, 139, 250, 0.4);
            background: rgba(167, 139, 250, 0.15);
            color: #a78bfa;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            cursor: pointer;
            transition: all 0.2s;
            margin: 8px;
        }
        .btn:hover { background: rgba(167,139,250,0.3); transform: translateY(-2px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-cyan {
            border-color: rgba(34,211,238,0.4);
            background: rgba(34,211,238,0.15);
            color: #22d3ee;
        }
        .btn-cyan:hover { background: rgba(34,211,238,0.3); }
        .actions { text-align: center; margin-bottom: 32px; }
        .log-box {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 24px;
            font-family: 'Cascadia Code', 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.8;
            color: rgba(255,255,255,0.6);
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        .log-box .success { color: #34d399; }
        .log-box .info { color: #22d3ee; }
        .log-box .warning { color: #fbbf24; }
        .log-box .error { color: #f87171; }
        .jobs-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
        }
        .jobs-table th, .jobs-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .jobs-table th {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: rgba(255,255,255,0.3);
        }
        .jobs-table td { font-size: 14px; }
        .source-badge {
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .source-remotive { background: rgba(167,139,250,0.2); color: #a78bfa; }
        .source-arbeitnow { background: rgba(34,211,238,0.2); color: #22d3ee; }
        .source-adzuna { background: rgba(251,191,36,0.2); color: #fbbf24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge">🤖 Autonomous System</div>
            <h1>Recruiter Bot</h1>
            <p>OpusHire's automated job fetcher — Remotive · Arbeitnow · Adzuna</p>
        </div>

        <div class="stats-grid" id="stats">
            <div class="stat-card"><div class="value" id="stat-total">—</div><div class="label">Total Bot Jobs</div></div>
            <div class="stat-card"><div class="value" id="stat-remotive">—</div><div class="label">Remotive</div></div>
            <div class="stat-card"><div class="value" id="stat-arbeitnow">—</div><div class="label">Arbeitnow</div></div>
            <div class="stat-card"><div class="value" id="stat-adzuna">—</div><div class="label">Adzuna</div></div>
        </div>

        <div class="actions">
            <button class="btn" id="fetchBtn" onclick="triggerFetch()">🚀 Fetch New Jobs</button>
            <button class="btn btn-cyan" onclick="loadStatus()">📊 Refresh Status</button>
        </div>

        <div id="log" class="log-box">Waiting for input...</div>

        <div id="jobs-section" style="margin-top: 32px;">
            <h2 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 16px;">Recently Fetched Jobs</h2>
            <div style="overflow-x: auto;">
                <table class="jobs-table">
                    <thead><tr><th>Title</th><th>Company</th><th>Source</th><th>Type</th></tr></thead>
                    <tbody id="jobs-tbody"><tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.2)">Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const API = window.location.origin;
        const log = document.getElementById('log');
        function addLog(msg, cls = '') { log.innerHTML += '<span class="' + cls + '">' + msg + '</span>\\n'; log.scrollTop = log.scrollHeight; }

        async function loadStatus() {
            try {
                const res = await fetch(API + '/api/status');
                const { data } = await res.json();
                document.getElementById('stat-total').textContent = data.stats?.total ?? '—';
                document.getElementById('stat-remotive').textContent = data.stats?.remotive ?? '—';
                document.getElementById('stat-arbeitnow').textContent = data.stats?.arbeitnow ?? '—';
                document.getElementById('stat-adzuna').textContent = data.stats?.adzuna ?? '—';
                if (data.lastRun) addLog('Last run: ' + new Date(data.lastRun).toLocaleString(), 'info');
                loadJobs();
            } catch (e) { addLog('Failed to load status: ' + e.message, 'error'); }
        }

        async function loadJobs() {
            try {
                const res = await fetch(API + '/api/jobs');
                const { data } = await res.json();
                const tbody = document.getElementById('jobs-tbody');
                if (!data.length) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.2)">No bot jobs yet. Click "Fetch New Jobs" to start!</td></tr>'; return; }
                tbody.innerHTML = data.map(j => '<tr><td>' + j.title + '</td><td>' + j.company + '</td><td><span class="source-badge source-' + j.source + '">' + j.source + '</span></td><td>' + j.type + '</td></tr>').join('');
            } catch (e) { addLog('Failed to load jobs: ' + e.message, 'error'); }
        }

        async function triggerFetch() {
            const btn = document.getElementById('fetchBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Fetching...';
            log.innerHTML = '';
            addLog('🤖 Starting fetch cycle...', 'info');
            try {
                const res = await fetch(API + '/api/fetch', { method: 'POST' });
                const { data } = await res.json();
                addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                for (const r of data.results) {
                    addLog('📦 ' + r.source.toUpperCase(), 'info');
                    addLog('   Fetched: ' + r.fetched + ' | New: ' + r.newJobs + ' | Dupes: ' + r.duplicates, r.newJobs > 0 ? 'success' : 'warning');
                    if (r.errors.length) r.errors.forEach(e => addLog('   ⚠ ' + e, 'error'));
                }
                addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addLog('✅ Total new: ' + data.totalNew + ' | Duplicates skipped: ' + data.totalDuplicates, 'success');
                loadStatus();
            } catch (e) {
                addLog('❌ Fetch failed: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 Fetch New Jobs';
            }
        }

        loadStatus();
    </script>
</body>
</html>`;
}
//# sourceMappingURL=server.js.map