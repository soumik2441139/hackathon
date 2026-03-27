import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { fetchAllJobs, getBotStatus, getBotJobStats } from './bot.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
const ADMIN_KEY = (process.env.RECRUITER_BOT_ADMIN_KEY || '').trim();
const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function isLoopbackRequest(ip?: string): boolean {
    if (!ip) return false;
    return LOOPBACK_IPS.has(ip);
}

function requireDashboardAccess(req: Request, res: Response, next: NextFunction): void {
    if (isLoopbackRequest(req.ip)) {
        next();
        return;
    }

    if (!ADMIN_KEY) {
        res.status(503).json({ success: false, error: 'RECRUITER_BOT_ADMIN_KEY is required for remote access' });
        return;
    }

    const providedKey = req.header('x-bot-admin-key');
    if (providedKey && providedKey === ADMIN_KEY) {
        next();
        return;
    }

    res.status(401).json({ success: false, error: 'Unauthorized' });
}

app.use(cors());
app.use(express.json());

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/status', requireDashboardAccess, async (_req, res) => {
    const status = getBotStatus();
    const stats = await getBotJobStats();
    res.json({ success: true, data: { ...status, stats } });
});

app.post('/api/fetch', requireDashboardAccess, async (_req, res) => {
    try {
        const result = await fetchAllJobs();
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/jobs', requireDashboardAccess, async (req, res) => {
    const { BotJob } = require('./models/Job');
    
    // Security: Force string type to prevent NoSQL injection via object payloads
    const source = String(req.query.source || '').trim();
    
    const query: any = { source: { $ne: 'manual' } };
    if (source) query.source = source;

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
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
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

function getDashboardHTML(): string {
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
        .source-telegram { background: rgba(52,211,153,0.2); color: #34d399; }
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
            <div class="stat-card"><div class="value" id="stat-telegram">—</div><div class="label">Telegram</div></div>
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
        const ADMIN_KEY_STORAGE = 'opushire_recruiter_admin_key';

        function isLoopbackHost() {
            const host = window.location.hostname;
            return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
        }

        function getAdminKey(forcePrompt = false) {
            if (isLoopbackHost()) return '';
            const existing = (localStorage.getItem(ADMIN_KEY_STORAGE) || '').trim();
            if (existing && !forcePrompt) return existing;

            const entered = window.prompt('Enter recruiter bot admin key:', existing || '');
            const normalized = String(entered || '').trim();
            if (normalized) {
                localStorage.setItem(ADMIN_KEY_STORAGE, normalized);
            }
            return normalized;
        }

        async function apiFetch(path, options = {}, retryOnUnauthorized = true) {
            const headers = new Headers(options.headers || {});
            const adminKey = getAdminKey(false);
            if (adminKey) headers.set('x-bot-admin-key', adminKey);

            const requestOptions = { ...options, headers };
            let res = await fetch(API + path, requestOptions);

            if (retryOnUnauthorized && !isLoopbackHost() && (res.status === 401 || res.status === 503)) {
                const newKey = getAdminKey(true);
                if (newKey) {
                    headers.set('x-bot-admin-key', newKey);
                    res = await fetch(API + path, requestOptions);
                }
            }

            return res;
        }

        function addLog(msg, cls = '') {
            const span = document.createElement('span');
            if (cls) span.className = cls;
            span.textContent = String(msg);
            log.appendChild(span);
            log.appendChild(document.createTextNode('\n'));
            log.scrollTop = log.scrollHeight;
        }

        function renderEmptyJobs(message) {
            const tbody = document.getElementById('jobs-tbody');
            tbody.innerHTML = '';
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.style.textAlign = 'center';
            td.style.color = 'rgba(255,255,255,0.2)';
            td.textContent = message;
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        function createSourceBadge(source) {
            const safeSource = String(source || 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '');
            const badge = document.createElement('span');
            badge.className = 'source-badge source-' + (safeSource || 'unknown');
            badge.textContent = safeSource || 'unknown';
            return badge;
        }

        async function loadStatus() {
            try {
                const res = await apiFetch('/api/status');
                const payload = await res.json();
                if (!res.ok || !payload?.success) {
                    throw new Error(payload?.error || 'Unauthorized or unavailable');
                }
                const data = payload.data;
                document.getElementById('stat-total').textContent = data.stats?.total ?? '—';
                document.getElementById('stat-remotive').textContent = data.stats?.remotive ?? '—';
                document.getElementById('stat-arbeitnow').textContent = data.stats?.arbeitnow ?? '—';
                document.getElementById('stat-adzuna').textContent = data.stats?.adzuna ?? '—';
                document.getElementById('stat-telegram').textContent = data.stats?.telegram ?? '—';
                if (data.lastRun) addLog('Last run: ' + new Date(data.lastRun).toLocaleString(), 'info');
                loadJobs();
            } catch (e) { addLog('Failed to load status: ' + e.message, 'error'); }
        }

        async function loadJobs() {
            try {
                const res = await apiFetch('/api/jobs');
                const payload = await res.json();
                if (!res.ok || !payload?.success) {
                    throw new Error(payload?.error || 'Unauthorized or unavailable');
                }
                const data = payload.data;
                const tbody = document.getElementById('jobs-tbody');
                if (!Array.isArray(data) || !data.length) {
                    renderEmptyJobs('No bot jobs yet. Click "Fetch New Jobs" to start!');
                    return;
                }

                tbody.innerHTML = '';
                data.forEach(j => {
                    const tr = document.createElement('tr');

                    const tdTitle = document.createElement('td');
                    tdTitle.textContent = String(j.title || '');

                    const tdCompany = document.createElement('td');
                    tdCompany.textContent = String(j.company || '');

                    const tdSource = document.createElement('td');
                    tdSource.appendChild(createSourceBadge(j.source));

                    const tdType = document.createElement('td');
                    tdType.textContent = String(j.type || '');

                    tr.appendChild(tdTitle);
                    tr.appendChild(tdCompany);
                    tr.appendChild(tdSource);
                    tr.appendChild(tdType);
                    tbody.appendChild(tr);
                });
            } catch (e) { addLog('Failed to load jobs: ' + e.message, 'error'); }
        }

        async function triggerFetch() {
            const btn = document.getElementById('fetchBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Fetching...';
            log.innerHTML = '';
            addLog('🤖 Starting fetch cycle...', 'info');
            try {
                const res = await apiFetch('/api/fetch', { method: 'POST' });
                const payload = await res.json();
                if (!res.ok || !payload?.success) {
                    throw new Error(payload?.error || 'Unauthorized or unavailable');
                }
                const data = payload.data;
                addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                for (const r of data.results) {
                    addLog('📦 ' + r.source.toUpperCase(), 'info');
                    addLog('   Fetched: ' + r.fetched + ' | New: ' + r.newJobs + ' | Dupes: ' + r.duplicates, r.newJobs > 0 ? 'success' : 'warning');
                    if (Array.isArray(r.errors) && r.errors.length) r.errors.forEach(e => addLog('   ⚠ ' + e, 'error'));
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

        if (!isLoopbackHost()) {
            getAdminKey(false);
        }
        loadStatus();
    </script>
</body>
</html>`;
}
