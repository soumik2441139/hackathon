import puppeteer from 'puppeteer';
import { Job } from '../models/Job';
import { routeAIExtraction } from './ai-router.service';

export async function estimateSalaryWithAI(jobId: string) {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');

    const searchQuery = `${job.title} at ${job.company} salary`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en-US`;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--accept-lang=en-US']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

        // Wait a small bit for snippets to populate
        await new Promise(r => setTimeout(r, 1000));

        // Extract basic body text from Google Search results
        const html = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script, style, noscript');
            scripts.forEach((s: any) => s.remove());
            return document.body.innerText;
        });

        const bodyText = html.replace(/\s+/g, ' ').trim().substring(0, 3000); // 3000 chars is enough to capture snippets

        const systemPrompt = `You are an expert salary estimation bot. Below is the text extracted from a Google search.
Your sole purpose is to parse the raw snippets to extract the minimum and maximum annual salary.
You MUST return a JSON object with your extraction and a confidence_score (0-100).
- If a range is given like "$100k - $120k", return {"salaryMin": 100000, "salaryMax": 120000, "confidence_score": 95}.
- If a single number is given, use it for both min and max, or create a realistic +/- 10% range.
- If it's an internship with monthly stipend (e.g. 50,000/month), multiply by 12 to get annual.
- If absolutely no salary data can be found in the text, return {"salaryMin": 0, "salaryMax": 0, "confidence_score": 0}.
Format: {"salaryMin": Number, "salaryMax": Number, "confidence_score": Number}`;

        const userPrompt = `Google Search Snippets for "${searchQuery}":
${bodyText}`;

        const result = await routeAIExtraction({ systemPrompt, userPrompt });

        if (result.salaryMin > 0 || result.salaryMax > 0) {
            job.salaryMin = result.salaryMin || result.salaryMax;
            job.salaryMax = result.salaryMax || result.salaryMin;

            // Format the visual salary banner nicely
            const minK = Math.floor(job.salaryMin / 1000);
            const maxK = Math.floor(job.salaryMax / 1000);

            if (minK === maxK) {
                job.salary = `$${minK}k/yr`;
            } else {
                job.salary = `$${minK}k - $${maxK}k/yr`;
            }
            await job.save();
        }

        return job;
    } finally {
        await browser.close();
    }
}
