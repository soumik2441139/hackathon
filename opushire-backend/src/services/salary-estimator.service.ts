import puppeteer from 'puppeteer';
import { Job } from '../models/Job';

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
            scripts.forEach(s => s.remove());
            return document.body.innerText;
        });

        const bodyText = html.replace(/\s+/g, ' ').trim().substring(0, 3000); // 3000 chars is enough to capture snippets

        const prompt = `You are a salary estimation bot. Below is the text extracted from a Google search for "${searchQuery}".
Based ONLY on the text snippets provided, extract or estimate the minimum and maximum annual salary.
Respond ONLY with a JSON object in this format: {"salaryMin": Number, "salaryMax": Number}.
- If a range is given like "$100k - $120k", return {"salaryMin": 100000, "salaryMax": 120000}.
- If a single number is given, use it for both min and max, or create a realistic +/- 10% range.
- If it's an internship with monthly stipend (e.g. 50,000/month), multiply by 12 to get annual.
- If absolutely no salary data can be found in the text, return {"salaryMin": 0, "salaryMax": 0}.

Google Search Snippets:
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
        } else {
            throw new Error('Invalid response from Groq API');
        }
    } finally {
        await browser.close();
    }
}
