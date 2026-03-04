import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Job } from '../models/Job';

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

        const prompt = `You are an expert job data extraction bot.
Based ONLY on the context provided below, extract the EXACT "Job Title" and "Company Name".
Respond ONLY with a JSON object in this format: {"title": "The Job Title", "company": "The Company Name"}.
If you cannot find a company name, try to infer it from the text or return "Unknown".
If you cannot specify a job title, return "Unknown".

Context:
Title Tag: ${titleTag}
OG Title: ${ogTitle}
Body Content Snippet:
${bodyText}`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data: any = await groqRes.json();

        if (data.choices && data.choices[0].message.content) {
            let result;
            try {
                result = JSON.parse(data.choices[0].message.content);
            } catch (e) {
                throw new Error('AI did not return valid JSON');
            }

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
        } else {
            throw new Error('Invalid response from Groq API');
        }
    } finally {
        await browser.close();
    }
}
