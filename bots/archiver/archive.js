require('dotenv').config({ path: '../../opushire-backend/.env' });
require('dotenv').config({ path: '../../recruiter-bot/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');
const puppeteer = require('puppeteer');
const dns = require('dns').promises;
const net = require('net');

const POLL_INTERVAL = 60000; // Check DB every 60 seconds
const BATCH_SIZE = 3;
const isSingleRun = process.argv.includes('--single-run');

const BLOCKED_HOSTS = new Set([
    'localhost',
    '0.0.0.0',
    '169.254.169.254',
    'metadata.google.internal',
    'metadata.azure.internal',
]);

function isPrivateIpv4(address) {
    const parts = address.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;
    const [a, b] = parts;
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isPrivateIpv6(address) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:') || normalized.startsWith('::ffff:127.');
}

function isBlockedIpAddress(address) {
    const version = net.isIP(address);
    if (version === 4) return isPrivateIpv4(address);
    if (version === 6) return isPrivateIpv6(address);
    return false;
}

async function assertSafePublicUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
    }

    const hostname = (parsed.hostname || '').toLowerCase();
    if (!hostname) throw new Error('Missing hostname');
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
        throw new Error(`Blocked hostname: ${hostname}`);
    }
    if (isBlockedIpAddress(hostname)) {
        throw new Error(`Blocked IP: ${hostname}`);
    }

    const resolved = await dns.lookup(hostname, { all: true, verbatim: true });
    if (resolved.some((record) => isBlockedIpAddress(record.address))) {
        throw new Error(`Hostname resolves to private IP: ${hostname}`);
    }

    return parsed.toString();
}

async function incrementStat(db, metric, amount = 1) {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('botstats').updateOne(
        { date: today },
        { $inc: { [metric]: amount } },
        { upsert: true }
    );
}

async function logInsight(db, botId, botName, insight, count = 1) {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('botreports').findOneAndUpdate(
        { date: today, botId },
        {
            $setOnInsert: { botName, createdAt: new Date() },
            $push: {
                actions: { timestamp: new Date(), action: insight, count }
            },
            $inc: { 'summary.totalActions': 1, 'summary.jobsProcessed': count },
            $set: { updatedAt: new Date() }
        },
        { upsert: true }
    );
}

async function isJobDead(text, apiKey) {
    if (!text || text.length < 50) return true; // Empty page or barely any text = dead

    const prompt = `You are an AI assistant helping a job board. Determine if the text below indicates that the job posting is no longer available, closed, filled, or resulted in a 404/error page.
Answer ONLY with the word "YES" if the job is dead/unavailable, or "NO" if the job appears to be an active job posting.

Text snippet:
${text.substring(0, 1500)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await response.json();
    if (data.choices && data.choices[0].message.content) {
        return data.choices[0].message.content.trim().toUpperCase().includes('YES');
    }
    return false;
}

async function checkJobs(db, browser, apiKey) {
    try {
        // Find active jobs with external URLs that haven't been checked in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const jobsToCheck = await db.collection('jobs').find({
            isArchived: false,
            externalUrl: { $exists: true, $ne: "" },
            $or: [
                { lastUrlCheck: { $exists: false } },
                { lastUrlCheck: { $lt: twentyFourHoursAgo } }
            ]
        }).sort({ createdAt: 1 }).limit(BATCH_SIZE).toArray();

        if (jobsToCheck.length > 0) {
            console.log(`[Archiver] Found ${jobsToCheck.length} jobs to verify...`);
        }

        let archivedCount = 0;

        for (const job of jobsToCheck) {
            console.log(`  -> Verifying: ${job.title}...`);
            let isDead = false;
            let safeUrl;

            try {
                safeUrl = await assertSafePublicUrl(job.externalUrl);
            } catch (err) {
                console.log(`     Blocked unsafe URL: ${err.message}`);
                await db.collection('jobs').updateOne(
                    { _id: job._id },
                    { $set: { lastUrlCheck: new Date() } }
                );
                continue;
            }

            try {
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

                const response = await page.goto(safeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

                if (response && response.status() >= 400) {
                    isDead = true;
                } else {
                    const pageText = await page.evaluate(() => document.body.innerText);
                    isDead = await isJobDead(pageText, apiKey);
                }
                await page.close();
            } catch (err) {
                console.log(`     Failed to visit url, marking as dead: ${err.message}`);
                isDead = true; // Timeout or domain dead
            }

            if (isDead) {
                console.log(`     👻 GHOST JOB DETECTED! Archiving "${job.title}"`);
                await db.collection('jobs').updateOne(
                    { _id: job._id },
                    { $set: { isArchived: true, lastUrlCheck: new Date() } }
                );
                archivedCount++;
            } else {
                console.log(`     ✅ Job is active.`);
                await db.collection('jobs').updateOne(
                    { _id: job._id },
                    { $set: { lastUrlCheck: new Date() } }
                );
            }

            if (!isSingleRun) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (archivedCount > 0) {
            await incrementStat(db, 'ghostJobsArchived', archivedCount);
            await logInsight(db, 'bot6-archiver', 'Ghost Detector', `👻 Checked URLs and archived ${archivedCount} dead/ghost jobs`, archivedCount);
        }
    } catch (err) {
        console.error('Archiver DB Error:', err);
    }
}

async function runArchiver() {
    const uri = process.env.MONGODB_URI;
    const apiKey = process.env.GROQ_API_KEY;

    if (!uri || !apiKey) throw new Error('Missing DB or API Keys');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log(`👻 Bot 6 (Archiver): Connected to database. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    if (isSingleRun) {
        await checkJobs(db, browser, apiKey);
        console.log('👻 Archiver finished single run. Exiting.');
        await browser.close();
        await client.close();
        process.exit(0);
    } else {
        while (true) {
            await checkJobs(db, browser, apiKey);
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
    }
}

runArchiver().catch(console.error);
