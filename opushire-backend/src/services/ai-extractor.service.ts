import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Job } from '../models/Job';
import { routeAIExtraction } from './ai-router.service';

export async function autoFixJobWithAI(jobId: string) {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    if (!job.externalUrl) throw new Error('Job has no external URL to fetch from');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        await page.goto(job.externalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const html = await page.content();

        const $ = cheerio.load(html);
        const titleTag = $('title').text() || '';
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';

        $('script, style, noscript, svg, img, iframe').remove();
        let bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        bodyText = bodyText.substring(0, 4000); // Give Groq ~4000 chars

        const systemPrompt = `You are an expert job data extraction bot.
Your sole purpose is to parse raw DOM text.
You MUST return a JSON object with your extraction and a confidence_score (0-100).
If you cannot find the title or company, do not guess. Return "Unknown" and a low confidence_score.
Format: {"title": "The Job Title", "company": "The Company Name", "confidence_score": Number}`;

        const userPrompt = `Context:
Title Tag: ${titleTag}
OG Title: ${ogTitle}
Body Content Snippet:
${bodyText}`;

        const result = await routeAIExtraction({ systemPrompt, userPrompt });

        let wasUpdated = false;
        if (result.title && result.title !== 'Unknown') {
            job.title = result.title;
            wasUpdated = true;
        }
        if (result.company && result.company !== 'Unknown') {
            job.company = result.company;
            wasUpdated = true;
        }

        if (wasUpdated) {
            await job.save();
        }

        return job;
    } finally {
        await browser.close();
    }
}
