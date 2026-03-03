import { spawn, ChildProcess } from 'child_process';
import path from 'path';

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

export const startBot = (botId: string) => {
    const botConfig = BOTS.find(b => b.id === botId);
    if (!botConfig) throw new Error('Unknown bot ID');

    if (activeBots.has(botId)) {
        throw new Error(`${botConfig.name} is already running.`);
    }

    const scriptPath = path.resolve(__dirname, '../../../../', botConfig.dir);

    // Spawn standard detached process
    const child = spawn('node', [botConfig.script], {
        cwd: scriptPath,
        stdio: 'pipe'
    });

    const botState: BotProcess = {
        process: child,
        logs: [],
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

    // Windows force kill workaround
    spawn("taskkill", ["/pid", state.process.pid!.toString(), '/f', '/t']);

    state.status = 'stopped';
    state.logs.push(`[SYSTEM] Sent stop signal manually by Admin.`);

    // We let the close event clean up the map usually, but we force it here
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
    return state ? state.logs : ['[SYSTEM] Process is stopped entirely. No active memory logs.'];
};
