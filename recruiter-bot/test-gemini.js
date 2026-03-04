const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env' });

async function testGemini() {
    try {
        const url = 'https://bit.ly/4ckMtyU';
        console.log(`Fetching URL: ${url}`);

        // Use a standard user agent to avoid basic blocks
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(res.data);

        // Extract meta tags first as they are mostly reliable for SPAs
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const ogDesc = $('meta[property="og:description"]').attr('content') || '';
        const titleTag = $('title').text() || '';

        // Remove scripts and styles then get body text
        $('script, style').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000); // Send first 3k chars to LLM

        const context = `
        Meta parameters found:
        Title Tag: ${titleTag}
        OG Title: ${ogTitle}
        OG Description: ${ogDesc}
        
        Body Content Snippet:
        ${bodyText}
        `;

        console.log('Sending this context to Gemini:');
        console.log(context.substring(0, 500) + '...');

        const prompt = `You are a job data extraction bot. I am providing you with the scraped HTML metadata and text from a job posting URL.
Based ONLY on the context provided, extract the EXACT "Job Title" and "Company Name".
Respond ONLY with a JSON object in this format: {"title": "The Job Title", "company": "The Company Name"}.
If you cannot find a company name, try to infer it from the text or return "Unknown".

Context:
${context}`;

        const groqRes = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
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

        const data = await groqRes.json();

        if (data.choices && data.choices[0].message.content) {
            console.log('\n--- GROQ RESPONSE ---');
            console.log(data.choices[0].message.content);
        } else {
            console.log('No valid response from Groq', data);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testGemini();
