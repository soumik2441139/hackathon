const { spawn } = require('child_process');
const path = require('path');

// Configuration for all sub-agents in the ecosystem
const bots = [
    { name: 'Scanner', dir: 'bot1-scanner', script: 'scan.js', color: '\x1b[36m' },     // Cyan
    { name: 'Fixer', dir: 'bot2-fixer', script: 'fix.js', color: '\x1b[33m' },         // Yellow
    { name: 'Supervisor', dir: 'bot3-supervisor', script: 'supervise.js', color: '\x1b[35m' }, // Magenta
    { name: 'Archiver', dir: 'bot4-cleanup', script: 'cleanup.js', color: '\x1b[32m' }     // Green
];

console.log('🚀 Starting OpusHire Autonomous AI Bot Ecosystem...\n');

bots.forEach(bot => {
    const botProcess = spawn('node', [bot.script], {
        cwd: path.join(__dirname, bot.dir),
        stdio: 'pipe'
    });

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

console.log('✅ All 4 daemon bots deployed and streaming logs below:\n');
