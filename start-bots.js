const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = /^win/.test(process.platform);
const isDryRun = process.argv.includes('--dry-run');
const backendDir = path.join(__dirname, 'opushire-backend');
const recruiterDir = path.join(__dirname, 'recruiter-bot');
const backendProject = path.join(backendDir, 'tsconfig.json');
const recruiterProject = path.join(recruiterDir, 'tsconfig.json');
const backendTsNodeBin = path.join(backendDir, 'node_modules', '.bin', isWindows ? 'ts-node.cmd' : 'ts-node');
const recruiterTsNodeBin = path.join(recruiterDir, 'node_modules', '.bin', isWindows ? 'ts-node.cmd' : 'ts-node');

// Configuration for standalone TS bot daemons.
const bots = [
    {
        name: 'Recruiter',
        dir: 'recruiter-bot',
        color: '\x1b[31m',
        runtime: 'ts-node',
        script: 'src/cli.ts',
        compiledScript: 'dist/cli.js',
        project: recruiterProject,
        preferredTsNodeBin: recruiterTsNodeBin,
    },
    {
        name: 'Matcher',
        dir: 'bots/matcher',
        color: '\x1b[36m',
        runtime: 'ts-node',
        script: 'match.ts',
        project: backendProject,
        preferredTsNodeBin: backendTsNodeBin,
    },
    {
        name: 'Advisor',
        dir: 'bots/advisor',
        color: '\x1b[33m',
        runtime: 'ts-node',
        script: 'advise.ts',
        project: backendProject,
        preferredTsNodeBin: backendTsNodeBin,
    },
    {
        name: 'Enricher',
        dir: 'bots/linkedin-enricher',
        color: '\x1b[35m',
        runtime: 'ts-node',
        script: 'enrich.ts',
        project: backendProject,
        preferredTsNodeBin: backendTsNodeBin,
    }
];

function resolveTsNodeCommand(preferredTsNodeBin) {
    if (preferredTsNodeBin && fs.existsSync(preferredTsNodeBin)) {
        return preferredTsNodeBin;
    }

    if (fs.existsSync(backendTsNodeBin)) {
        return backendTsNodeBin;
    }

    return isWindows ? 'npx.cmd' : 'npx';
}

function buildLaunchConfig(bot) {
    const botDir = path.join(__dirname, bot.dir);

    if (bot.compiledScript) {
        const compiledScriptPath = path.join(botDir, bot.compiledScript);
        if (fs.existsSync(compiledScriptPath)) {
            return {
                cwd: botDir,
                cmd: 'node',
                args: [bot.compiledScript],
            };
        }
    }

    const tsNodeCommand = resolveTsNodeCommand(bot.preferredTsNodeBin);
    if (path.basename(tsNodeCommand).startsWith('ts-node')) {
        return {
            cwd: botDir,
            cmd: tsNodeCommand,
            args: ['--project', bot.project, bot.script],
        };
    }

    return {
        cwd: botDir,
        cmd: tsNodeCommand,
        args: ['ts-node', '--project', bot.project, bot.script],
    };
}

const activeProcesses = [];

function stopAllBots() {
    for (const bot of activeProcesses) {
        const pid = bot.process.pid;
        if (!pid) continue;

        if (isWindows) {
            spawn('taskkill', ['/pid', String(pid), '/f', '/t']);
        } else {
            bot.process.kill('SIGTERM');
        }
    }
}

process.on('SIGINT', () => {
    console.log('\n[SYSTEM] Stopping all standalone bot daemons...');
    stopAllBots();
    process.exit(0);
});

process.on('SIGTERM', () => {
    stopAllBots();
    process.exit(0);
});

console.log('🚀 Starting OpusHire Autonomous AI Bot Ecosystem...\n');

bots.forEach(bot => {
    const launch = buildLaunchConfig(bot);
    const renderedCommand = `${launch.cmd} ${launch.args.join(' ')}`;

    if (isDryRun) {
        console.log(`[DRY RUN] ${bot.name} -> cwd=${launch.cwd}`);
        console.log(`[DRY RUN] ${bot.name} -> ${renderedCommand}`);
        return;
    }

    console.log(`[SYSTEM] Launching ${bot.name} with: ${renderedCommand}`);
    const botProcess = spawn(launch.cmd, launch.args, {
        cwd: launch.cwd,
        stdio: 'pipe',
        shell: isWindows
    });
    activeProcesses.push({ name: bot.name, process: botProcess });

    // Pipe standard output securely with color-coded tags
    botProcess.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.log(`${bot.color}[${bot.name}]\x1b[0m ${line}`);
        });
    });

    // Pipe standard errors with red tags
    botProcess.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line) console.error(`\x1b[31m[${bot.name} ERROR]\x1b[0m ${line}`);
        });
    });

    botProcess.on('close', (code) => {
        console.log(`❌ [${bot.name}] crashed or exited with code ${code}`);
    });
});

if (isDryRun) {
    console.log('\n✅ Dry run complete. No bots were started.');
} else {
    console.log('✅ All daemon bots deployed and streaming logs below:\n');
}
