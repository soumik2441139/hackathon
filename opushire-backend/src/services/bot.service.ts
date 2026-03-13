import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import BotReport from '../models/BotReport';

type BotRuntime = 'node' | 'ts-node';

interface BotConfig {
    id: string;
    name: string;
    description: string;
    dir: string;
    script: string;
    color: string;
    runtime?: BotRuntime;
    compiledScript?: string;
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
    { id: 'bot1-scanner', name: 'Scanner', description: 'Scans new jobs and flags broken tag tiles.', dir: 'bots/scanner', script: 'scan.js', color: '#06b6d4' },
    { id: 'bot2-fixer', name: 'Fixer', description: 'Takes flagged tags and generates keywords via Gemini LLM.', dir: 'bots/fixer', script: 'fix.js', color: '#eab308' },
    { id: 'bot3-supervisor', name: 'Supervisor', description: 'QA Agent utilizing Groq Llama-3 to prevent hallucination.', dir: 'bots/supervisor', script: 'supervise.js', color: '#d946ef' },
    { id: 'bot4-cleanup', name: 'Cleaner', description: 'Removes old or invalid job postings through record rotation.', dir: 'bots/cleanup', script: 'cleanup.js', color: '#22c55e' },
    { id: 'bot6-archiver', name: 'Ghost Detector', description: 'Visits active links with Puppeteer to archive dead positions.', dir: 'bots/archiver', script: 'archive.js', color: '#10b981' },
    { id: 'bot7-matcher', name: 'Matcher', description: 'Matches parsed resumes to jobs via semantic ranking.', dir: 'bots/matcher', script: 'match.ts', runtime: 'ts-node', color: '#06b6d4' },
    { id: 'bot8-advisor', name: 'Advisor', description: 'Generates skill-gap insights and learning plans.', dir: 'bots/advisor', script: 'advise.ts', runtime: 'ts-node', color: '#f59e0b' },
    { id: 'bot9-linkedin-enricher', name: 'LinkedIn Enricher', description: 'Enriches resume metadata from LinkedIn profile details.', dir: 'bots/linkedin-enricher', script: 'enrich.ts', runtime: 'ts-node', color: '#a855f7' }
];

interface BotProcess {
    process: ChildProcess;
    status: 'online' | 'stopped' | 'error';
    startTime?: Date;
}

const activeBots = new Map<string, BotProcess>();
const MAX_LOG_LINES = 100;

// Centralized physical logs directory
const LOG_DIR = process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'opushire-logs')
    : path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (err) {
        console.warn(`⚠️ Failed to create log directory at ${LOG_DIR}:`, err);
    }
}

function getLogFilePath(botId: string): string {
    return path.join(LOG_DIR, `${botId}.log`);
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
        path.resolve(__dirname, '../../../', botDir),
        path.resolve(__dirname, '../../../../', botDir)
    ];

    const foundPath = candidates.find(candidate => fs.existsSync(candidate));
    return foundPath || candidates[0];
}

function getTsProjectPath(scriptPath: string): string | undefined {
    const backendDir = getBotScriptDir('opushire-backend');
    const candidates = [
        path.join(scriptPath, 'tsconfig.json'),
        path.join(backendDir, 'tsconfig.json')
    ];
    return candidates.find(candidate => fs.existsSync(candidate));
}

export const startBot = (botId: string, args: string[] = []) => {
    return new Promise<void>((resolve, reject) => {
        const botConfig = BOTS.find(b => b.id === botId);
        if (!botConfig) throw new Error('Unknown bot ID');

        if (activeBots.has(botId)) {
            return reject(new Error(`${botConfig.name} is already running.`));
        }

        const scriptPath = getBotScriptDir(botConfig.dir);
        const isSingleRun = args.includes('--single-run');
        let childUrl = 'node';
        let childArgs = [botConfig.script, ...args];

        if (botConfig.runtime === 'ts-node') {
            const compiledScriptPath = botConfig.compiledScript
                ? path.join(scriptPath, botConfig.compiledScript)
                : null;

            if (compiledScriptPath && fs.existsSync(compiledScriptPath)) {
                // Prefer compiled JS when available to avoid runtime ts-node requirement.
                childUrl = 'node';
                childArgs = [botConfig.compiledScript!, ...args];
            } else {
                const tsProjectPath = getTsProjectPath(scriptPath);
                const backendDir = getBotScriptDir('opushire-backend');
                const localTsNodeBin = path.join(
                    backendDir,
                    'node_modules',
                    '.bin',
                    os.platform() === 'win32' ? 'ts-node.cmd' : 'ts-node'
                );

                if (fs.existsSync(localTsNodeBin)) {
                    childUrl = localTsNodeBin;
                    childArgs = [
                        ...(tsProjectPath ? ['--project', tsProjectPath] : []),
                        botConfig.script,
                        ...args
                    ];
                } else {
                    childUrl = os.platform() === 'win32' ? 'npx.cmd' : 'npx';
                    childArgs = [
                        'ts-node',
                        ...(tsProjectPath ? ['--project', tsProjectPath] : []),
                        botConfig.script,
                        ...args
                    ];
                }
            }
        }

        const child = spawn(childUrl, childArgs, {
            cwd: scriptPath,
            stdio: 'pipe',
            shell: os.platform() === 'win32'
        });

        const botState: BotProcess = {
            process: child,
            status: 'online',
            startTime: new Date()
        };
        activeBots.set(botId, botState);

        writeLog(botId, [`[SYSTEM] Starting ${botConfig.name} from ${scriptPath} with command "${childUrl} ${childArgs.join(' ')}" and args [${args.join(',')}]...`]);
        // System logs removed from UI reports to keep it insight-only
        // (BotReport as any).logAction(botId, botConfig.name, `🚀 Started (args: ${args.join(',') || 'none'})`, 0).catch(() => { });

        const appendChildLog = (data: Buffer) => {
            const lines = data.toString().trim().split('\n').filter(Boolean);
            if (lines.length > 0) writeLog(botId, lines);
        };

        child.stdout?.on('data', appendChildLog);
        child.stderr?.on('data', appendChildLog);

        child.on('error', (err) => {
            const state = activeBots.get(botId);
            if (state) state.status = 'error';
            writeLog(botId, [`[ERROR] Failed to start process: ${err.message}`]);
            reject(err);
        });

        child.on('close', (code) => {
            const state = activeBots.get(botId);
            if (state) state.status = code === 0 ? 'stopped' : 'error';
            writeLog(botId, [`[SYSTEM] Process exited with code ${code}`]);

            // Only log actual fatal errors to the daily report UI
            if (code !== 0) {
                (BotReport as any).logError(botId, botConfig.name, `❌ Process exited with code ${code}`).catch(() => { });
            }

            setTimeout(() => {
                activeBots.delete(botId);
            }, 2000);

            if (isSingleRun) {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`${botConfig.name} exited with code ${code}`));
                }
            }
        });

        if (!isSingleRun) {
            // Daemon starts should return immediately after process launch.
            resolve();
        }
    });
};

export const startPipeline = async () => {
    if (activeBots.size > 0) {
        console.log('[PIPELINE] Forcing stop on active continuous bots to start autonomous pipeline...');
        for (const [id] of activeBots.entries()) {
            try { stopBot(id); } catch(e) {}
        }
        // Give the OS 2 seconds to gracefully kill the processes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('[PIPELINE] Starting autonomous sequential ecosystem run...');

    // Sequential await spawn using the --single-run flag
    for (const bot of BOTS) {
        console.log(`[PIPELINE] Trigerring -> ${bot.id}`);
        try {
            await startBot(bot.id, ['--single-run']);
        } catch (e: any) {
            console.error(`[PIPELINE] Fatal failure executing ${bot.id}`, e);
            await (BotReport as any).logError(bot.id, bot.name, `Pipeline execution failed: ${e.message}`).catch(() => { });
            // Don't throw — continue with other bots
        }
    }

    console.log('[PIPELINE] Complete. All autonomous actions finished.');
};

export const stopBot = (botId: string) => {
    const state = activeBots.get(botId);
    if (!state) throw new Error('Bot is not currently running');

    const pid = state.process.pid;
    if (pid) {
        if (os.platform() === 'win32') {
            spawn('taskkill', ['/pid', pid.toString(), '/f', '/t']);
        } else {
            try {
                process.kill(pid, 'SIGTERM');
            } catch { }
        }
    }

    state.status = 'stopped';
    writeLog(botId, [`[SYSTEM] Stop signal sent by Admin.`]);

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
    const filePath = getLogFilePath(botId);
    if (!fs.existsSync(filePath)) {
        return ['[SYSTEM] This bot has no logs yet. Click Start Agent to begin.'];
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        return lines.slice(Math.max(lines.length - MAX_LOG_LINES, 0));
    } catch {
        return ['[ERROR] Failed to read log file on disk.'];
    }
};
