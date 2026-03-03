import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';

// Define the static bots available to the system
export const BOTS = [
    { id: 'scanner', name: 'Scanner', description: 'Scans new jobs and flags broken tag tiles.', dir: 'bot1-scanner', script: 'scan.js', color: '#06b6d4' },
    { id: 'fixer', name: 'Fixer', description: 'Takes flagged tags and generates keywords via Gemini LLM.', dir: 'bot2-fixer', script: 'fix.js', color: '#eab308' },
    { id: 'supervisor', name: 'Supervisor', description: 'QA Agent utilizing Groq Llama-3 to prevent hallucination.', dir: 'bot3-supervisor', script: 'supervise.js', color: '#d946ef' },
    { id: 'archiver', name: 'Archiver', description: 'Soft-archives week-old jobs & hard deletes 3-week-old data.', dir: 'bot4-cleanup', script: 'cleanup.js', color: '#22c55e' }
];

interface BotProcess {
    process: ChildProcess;
    logs: string[];
    status: 'online' | 'stopped' | 'error';
    startTime?: Date;
}

const activeBots = new Map<string, BotProcess>();
const MAX_LOG_LINES = 100;

/**
 * Resolve the bot script directory.
 * In development (__dirname = src/services) → 4 levels up to repo root.
 * In production   (__dirname = dist/services) → also 4 levels up.
 * On Azure the repo root contains all bot directories because we deploy them.
 */
function getBotScriptDir(botDir: string): string {
    // Try to find from CWD first (most reliable in production)
    const cwdPath = path.resolve(process.cwd(), botDir);
    // Fallback: resolve relative to __dirname going up 4 levels
    const relPath = path.resolve(__dirname, '../../../../', botDir);

    // Return the one that's more likely to exist based on the environment
    return process.env.NODE_ENV === 'production' ? cwdPath : relPath;
}

export const startBot = (botId: string) => {
    const botConfig = BOTS.find(b => b.id === botId);
    if (!botConfig) throw new Error('Unknown bot ID');

    if (activeBots.has(botId)) {
        throw new Error(`${botConfig.name} is already running.`);
    }

    const scriptPath = getBotScriptDir(botConfig.dir);

    // Spawn standard detached process
    const child = spawn('node', [botConfig.script], {
        cwd: scriptPath,
        stdio: 'pipe'
    });

    const botState: BotProcess = {
        process: child,
        logs: [`[SYSTEM] Starting ${botConfig.name} from ${scriptPath}...`],
        status: 'online',
        startTime: new Date()
    };
    activeBots.set(botId, botState);

    const appendLog = (data: Buffer) => {
        const lines = data.toString().trim().split('\n').filter(Boolean);
        const state = activeBots.get(botId);
        if (state) {
            state.logs.push(...lines);
            if (state.logs.length > MAX_LOG_LINES) {
                state.logs = state.logs.slice(state.logs.length - MAX_LOG_LINES);
            }
        }
    };

    child.stdout?.on('data', appendLog);
    child.stderr?.on('data', appendLog);

    child.on('error', (err) => {
        const state = activeBots.get(botId);
        if (state) {
            state.status = 'error';
            state.logs.push(`[ERROR] Failed to start process: ${err.message}`);
            state.logs.push(`[ERROR] Looked for scripts in: ${scriptPath}`);
        }
    });

    child.on('close', (code) => {
        const state = activeBots.get(botId);
        if (state) {
            state.status = code === 0 ? 'stopped' : 'error';
            state.logs.push(`[SYSTEM] Process exited with code ${code}`);
        }
    });

    return getBotStatus(botId);
};

export const stopBot = (botId: string) => {
    const state = activeBots.get(botId);
    if (!state) throw new Error('Bot is not currently running');

    const pid = state.process.pid;
    if (pid) {
        if (os.platform() === 'win32') {
            // Windows: use taskkill
            spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
        } else {
            // Linux/macOS (Azure App Service runs Linux)
            try {
                process.kill(pid, 'SIGTERM');
            } catch {
                // Process might already be dead
            }
        }
    }

    state.status = 'stopped';
    state.logs.push(`[SYSTEM] Stop signal sent by Admin.`);

    setTimeout(() => {
        activeBots.delete(botId);
    }, 1000);

    return getBotStatus(botId);
};

export const getBotStatus = (botId: string) => {
    const config = BOTS.find(b => b.id === botId);
    if (!config) return null;

    const state = activeBots.get(botId);
    return {
        ...config,
        status: state?.status || 'stopped',
        uptime: state?.startTime ? (new Date().getTime() - state.startTime.getTime()) / 1000 : 0
    };
};

export const getAllBotStatuses = () => {
    return BOTS.map(bot => getBotStatus(bot.id));
};

export const getBotLogs = (botId: string) => {
    const state = activeBots.get(botId);
    return state ? state.logs : ['[SYSTEM] This bot is not running. Click Start Agent to begin.'];
};
