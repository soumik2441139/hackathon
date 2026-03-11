const { spawn } = require('child_process');
const path = require('path');

// Configuration for all sub-agents in the ecosystem
const bots = [
    { name: 'Recruiter', dir: 'recruiter-bot', cmd: /^win/.test(process.platform) ? 'npx.cmd' : 'npx', args: ['ts-node', 'src/cli.ts'], color: '\x1b[31m' }, // Red
    { name: 'Matcher', dir: 'bots/matcher', cmd: /^win/.test(process.platform) ? 'npx.cmd' : 'npx', args: ['ts-node', 'match.ts'], color: '\x1b[36m' },     // Cyan
    { name: 'Advisor', dir: 'bots/advisor', cmd: /^win/.test(process.platform) ? 'npx.cmd' : 'npx', args: ['ts-node', 'advise.ts'], color: '\x1b[33m' },         // Yellow
    { name: 'Enricher', dir: 'bots/linkedin-enricher', cmd: /^win/.test(process.platform) ? 'npx.cmd' : 'npx', args: ['ts-node', 'enrich.ts'], color: '\x1b[35m' } // Magenta
];

console.log('🚀 Starting OpusHire Autonomous AI Bot Ecosystem...\n');

bots.forEach(bot => {
    const botProcess = spawn(bot.cmd, bot.args, {
        cwd: path.join(__dirname, bot.dir),
        stdio: 'pipe',
        shell: /^win/.test(process.platform)
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

console.log('✅ All daemon bots deployed and streaming logs below:\n');
