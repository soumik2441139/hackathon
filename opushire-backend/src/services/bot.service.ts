import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import BotReport from '../models/BotReport';
import { getQueue, enqueue, type QueueName } from './queue/queue.service';
import { WebSocketService } from './websocket.service';

type BotRuntime = 'node' | 'ts-node';

interface BotConfig {
    id: string;
    name: string;
    description: string;
    color: string;
    // Legacy CLI attributes
    dir?: string;
    script?: string;
    runtime?: BotRuntime;
    compiledScript?: string;
    // New Cloud-Native Architecture Queue Links
    queueName?: QueueName | 'archive-jobs'; // fallback for missing enum types if any
}

export const BOTS: BotConfig[] = [
    {
        id: 'bot0-recruiter',
        name: 'Recruiter',
        description: 'Scrapes jobs from integrated sources.',
        dir: 'recruiter-bot',
        script: 'src/cli.ts',
        runtime: 'ts-node',
        compiledScript: 'dist/cli.js',
        color: '#ff4b4b'
    },
    { id: 'bot1-scanner', name: 'Scanner', description: 'Scans new jobs and flags broken tag tiles.', queueName: 'scan-jobs', color: '#06b6d4' },
    { id: 'bot2-fixer', name: 'Fixer', description: 'Takes flagged tags and generates keywords via Gemini LLM.', queueName: 'fix-tags', color: '#eab308' },
    { id: 'bot3-supervisor', name: 'Supervisor', description: 'QA Agent utilizing Groq Llama-3 to prevent hallucination.', queueName: 'supervise-tags', color: '#d946ef' },
    { id: 'bot4-cleanup', name: 'Cleaner', description: 'Removes old or invalid job postings through record rotation.', queueName: 'cleanup-jobs', color: '#22c55e' },
    { id: 'bot6-archiver', name: 'Ghost Detector', description: 'Visits active links with Puppeteer to archive dead positions.', queueName: 'archive-jobs', color: '#10b981' },
    { id: 'bot7-matcher', name: 'Matcher', description: 'Matches parsed resumes to jobs via semantic ranking.', queueName: 'match-resumes', color: '#06b6d4' },
    { id: 'bot8-advisor', name: 'Advisor', description: 'Generates skill-gap insights and learning plans.', queueName: 'career-advisor', color: '#f59e0b' },
    { id: 'bot9-linkedin-enricher', name: 'LinkedIn Enricher', description: 'Enriches resume metadata from LinkedIn profile details.', queueName: 'linkedin-enrich', color: '#a855f7' }
];

interface BotProcess {
    process: ChildProcess;
    status: 'online' | 'stopped' | 'error';
    startTime?: Date;
}

const activeLegacyBots = new Map<string, BotProcess>();
const cloudNativeBotState = new Map<string, string>(); // 'online' | 'stopped'
const MAX_LOG_LINES = 100;

const LOG_DIR = process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'opushire-logs')
    : path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
    try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (err) { }
}

function getLogFilePath(botId: string): string {
    const safeBotId = path.basename(botId);
    return path.join(LOG_DIR, `${safeBotId}.log`);
}

function writeLog(botId: string, lines: string[]) {
    const timestamp = new Date().toISOString();
    const formattedLines = lines.map(line => `[${timestamp}] ${line}\n`).join('');
    fs.appendFileSync(getLogFilePath(botId), formattedLines);
}

function getBotScriptDir(botDir: string): string {
    const candidates = [
        path.resolve(process.cwd(), botDir),
        path.resolve(process.cwd(), '..', botDir),
        path.resolve(__dirname, '../../../', botDir)
    ];
    return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0];
}

export const startBot = async (botId: string, args: string[] = []) => {
    const config = BOTS.find(b => b.id === botId);
    if (!config) throw new Error('Unknown bot ID');

    if (config.queueName) {
        // MICROSERVICE CLOUD-NATIVE START (BullMQ Unpause)
        const queue = await getQueue(config.queueName as QueueName);
        if (queue) {
            await queue.resume();
            cloudNativeBotState.set(botId, 'online');
            writeLog(botId, [`[SYSTEM] Cloud-Native Bot awakened: Redis Queue '${config.queueName}' resumed.`]);
            WebSocketService.broadcast('bot_status', { botId, status: 'online' });
            
            // For periodic sweep bots without event-triggers, we fire a dummy job to kickstart them
            if (botId === 'bot4-cleanup' || botId === 'bot1-scanner') {
                await enqueue(config.queueName as QueueName, 'trigger', {});
            }
        }
        return Promise.resolve();
    }

    // LEGACY CLI BOT START
    return new Promise<void>((resolve, reject) => {
        if (activeLegacyBots.has(botId)) return reject(new Error(`${config.name} is already running.`));

        const scriptPath = getBotScriptDir(config.dir!);
        const isSingleRun = args.includes('--single-run');
        const isProduction = process.env.NODE_ENV === 'production';
        
        let childUrl = 'node';
        let childArgs = [];

        // In production, we favor the compiled JS to avoid npx/ts-node overhead and PATH issues
        if (isProduction && config.compiledScript) {
            childUrl = 'node';
            childArgs = [config.compiledScript, ...args];
        } else if (config.runtime === 'ts-node') {
            childUrl = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
            childArgs = ['ts-node', config.script!, ...args];
        } else {
            childArgs = [config.script!, ...args];
        }

        // In production container environments, we must use the absolute path to the Node executable 
        // to prevent 'ENOENT' errors when attempting to spawn 'node' without a shell.
        if (childUrl === 'node') {
            childUrl = process.execPath;
        }

        // Disable shell on Linux to prevent '/bin/sh ENOENT' errors in restricted Azure containers
        const child = spawn(childUrl, childArgs, { 
            cwd: scriptPath, 
            env: process.env, // Pass environment variables implicitly
            stdio: 'pipe', 
            shell: os.platform() === 'win32' 
        });

        activeLegacyBots.set(botId, { process: child, status: 'online', startTime: new Date() });
        writeLog(botId, [`[SYSTEM] Booting Legacy CLI Process from ${scriptPath}...`]);

        const appendChildLog = (data: Buffer) => {
            const lines = data.toString().trim().split('\n').filter(Boolean);
            if (lines.length > 0) writeLog(botId, lines);
        };
        child.stdout?.on('data', appendChildLog);
        child.stderr?.on('data', appendChildLog);

        child.on('error', (err) => {
            activeLegacyBots.get(botId)!.status = 'error';
            writeLog(botId, [`[ERROR] Failed to start legacy process: ${err.message}`]);
            reject(err);
        });

        child.on('close', (code) => {
            activeLegacyBots.get(botId)!.status = code === 0 ? 'stopped' : 'error';
            writeLog(botId, [`[SYSTEM] Bot exited with code ${code}`]);
            setTimeout(() => activeLegacyBots.delete(botId), 2000);
            if (isSingleRun) code === 0 ? resolve() : reject(new Error(`${config.name} exited with code ${code}`));
        });

        if (!isSingleRun) resolve();
    });
};

export const stopBot = async (botId: string) => {
    const config = BOTS.find(b => b.id === botId);
    if (!config) throw new Error('Bot is not currently running');

    if (config.queueName) {
        // MICROSERVICE CLOUD-NATIVE STOP (BullMQ Pause)
        const queue = await getQueue(config.queueName as QueueName);
        if (queue) {
            await queue.pause();
            cloudNativeBotState.set(botId, 'stopped');
            writeLog(botId, [`[SYSTEM] Cloud-Native Bot paused: Redis Queue '${config.queueName}' halted.`]);
            WebSocketService.broadcast('bot_status', { botId, status: 'stopped' });
        }
    } else {
        // LEGACY CLI BOT STOP
        const state = activeLegacyBots.get(botId);
        if (state && state.process.pid) {
            if (os.platform() === 'win32') {
                spawn('taskkill', ['/pid', state.process.pid.toString(), '/f', '/t']);
            } else {
                try { process.kill(state.process.pid, 'SIGTERM'); } catch { }
            }
            state.status = 'stopped';
            writeLog(botId, [`[SYSTEM] SIGTERM sent by Admin.`]);
            setTimeout(() => activeLegacyBots.delete(botId), 1000);
        }
    }

    return getBotStatus(botId);
};

export const getBotStatus = async (botId: string) => {
    const config = BOTS.find(b => b.id === botId);
    if (!config) return null;

    if (config.queueName) {
        // CLOUD NATIVE STATUS
        const queue = await getQueue(config.queueName as QueueName);
        let status = cloudNativeBotState.get(botId) || 'stopped';
        let customStats: Record<string, number> = { waiting: 0, active: 0, completed: 0, failed: 0 };
        
        if (queue) {
            customStats = await queue.getJobCounts('wait', 'active', 'completed', 'failed');
            // Auto flip state if jobs are actively processing
            if (customStats.active > 0) status = 'online';
        }

        return { ...config, status, uptime: status === 'online' ? 999999 : 0, stats: customStats };
    } else {
        // LEGACY STATUS
        const state = activeLegacyBots.get(botId);
        return {
            ...config,
            status: state?.status || 'stopped',
            uptime: state?.startTime ? (new Date().getTime() - state.startTime.getTime()) / 1000 : 0
        };
    }
};

export const getAllBotStatuses = async () => {
    const statuses = await Promise.all(BOTS.map(bot => getBotStatus(bot.id)));
    return statuses;
};

export const getBotLogs = (botId: string) => {
    const safeBotId = path.basename(botId);
    const filePath = getLogFilePath(safeBotId);
    if (!fs.existsSync(filePath)) return ['[SYSTEM] This bot has no logs yet. Click Start Agent to begin.'];
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        return lines.slice(Math.max(lines.length - MAX_LOG_LINES, 0));
    } catch {
        return ['[ERROR] Failed to read log file on disk.'];
    }
};

export const startPipeline = async () => {
    // Pipeline now instantly fires BullMQ jobs instead of child node scripts!
    await startBot('bot1-scanner');
};
