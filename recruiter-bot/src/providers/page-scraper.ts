import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Deep Job Portal Scraper — visits the actual career page and
 * extracts structured data using DOM parsing (cheerio).
 *
 * Supports:
 *   ✅ Greenhouse (greenhouse.io)
 *   ✅ Lever (lever.co, jobs.lever.co)
 *   ✅ LinkedIn (linkedin.com/jobs)
 *   ✅ Generic career pages
 */

export interface ScrapedJob {
    description: string;
    responsibilities: string[];
    requirements: string[];
    tags: string[];       // "Nice to have" / skills
    salary: string;
    location: string;
    title: string;        // From the actual page (more accurate)
    company: string;      // From the actual page
}

const EMPTY_RESULT: ScrapedJob = {
    description: '', responsibilities: [], requirements: [],
    tags: [], salary: '', location: '', title: '', company: '',
};

function extractBullets($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string[] {
    const bullets: string[] = [];

    // Sometimes it's a <ul> directly following the header
    const nextElem = element.next();
    if (nextElem.is('ul') || nextElem.is('ol')) {
        nextElem.find('li').each((_, li) => {
            const text = $(li).text().trim();
            if (text.length > 5) bullets.push(text.replace(/^[\s•\-\*▪]+/, '').trim());
        });
    } else {
        // sometimes they use <p> or <br> separated lists
        let curr = element.next();
        while (curr.length > 0 && !curr.is('h1, h2, h3, h4, h5, strong, b')) {
            if (curr.is('ul') || curr.is('ol')) {
                curr.find('li').each((_, li) => {
                    const text = $(li).text().trim();
                    if (text.length > 5) bullets.push(text.replace(/^[\s•\-\*▪]+/, '').trim());
                });
            } else {
                const text = curr.text().trim();
                if (text.length > 10 && text.includes('•')) {
                    text.split('•').forEach(t => {
                        const clean = t.trim();
                        if (clean.length > 5) bullets.push(clean);
                    });
                } else if (text.length > 10) {
                    bullets.push(text);
                }
            }
            curr = curr.next();
        }
    }

    return bullets.filter(b => b.length > 5 && b.length < 400).slice(0, 15);
}

// ─── Greenhouse Scraper ─────────────────────────────────────────────────────

function scrapeGreenhouse($: cheerio.CheerioAPI): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    // Get Title
    const appTitle = $('h1.app-title').first().text().trim();
    if (appTitle) {
        result.title = appTitle;
    }

    // Get Company
    const companyClass = $('.company-name').first().text().trim();
    if (companyClass) {
        result.company = companyClass.replace(/^at\s+/i, '').trim();
    }

    // Parse Sections (Greenhouse uses h3 or strong for section headers)
    const contentDiv = $('#content');
    if (contentDiv.length === 0) return result;

    contentDiv.find('h2, h3, h4, p > strong, div > b').each((_, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        const parent = $(el).is('strong, b') ? $(el).parent() : $(el);

        // Description
        if (headerText.includes('about the role') || headerText.includes('about the position') || headerText.includes('the objective')) {
            let descText = '';
            let curr = parent.next();
            while (curr.length > 0 && !curr.is('h2, h3, h4') && !curr.find('strong, b').length && !curr.is('ul')) {
                descText += curr.text().trim() + '\n\n';
                curr = curr.next();
            }
            if (descText) result.description = descText.trim().slice(0, 2000);
        }

        // Responsibilities
        if (headerText.includes("you'll do") || headerText.includes("you will do") || headerText.includes('responsibilities') || headerText.includes('your role')) {
            result.responsibilities = extractBullets($, parent);
        }

        // Requirements
        if (headerText.includes('looking for') || headerText.includes('requirements') || headerText.includes('qualifications') || headerText.includes('must have') || headerText.includes('what you need')) {
            result.requirements = extractBullets($, parent);
        }

        // Tags/Skills
        if (headerText.includes('nice to have') || headerText.includes('preferred') || headerText.includes('bonus') || headerText.includes('tech stack') || headerText.includes('learn here')) {
            result.tags = extractBullets($, parent);
        }
    });

    // Location
    const locText = $('.location').first().text().trim();
    if (locText) result.location = locText;

    return result;
}

// ─── Lever Scraper ──────────────────────────────────────────────────────────

function scrapeLever($: cheerio.CheerioAPI): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    const titleH2 = $('h2').first().text().trim();
    if (titleH2) result.title = titleH2;

    const locDiv = $('.sort-by-time').first().text().trim();
    if (locDiv) result.location = locDiv.split('/')[0].trim();

    $('.posting-requirements h3, .posting-requirements h4, h3, h4, b, strong').each((_, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        const parent = $(el).is('strong, b') ? $(el).parent() : $(el);

        if (headerText.includes("you'll do") || headerText.includes('responsibilities') || headerText.includes('in this role')) {
            result.responsibilities = extractBullets($, parent);
        }
        if (headerText.includes('requirements') || headerText.includes('qualifications') || headerText.includes('looking for') || headerText.includes('what you need')) {
            result.requirements = extractBullets($, parent);
        }
        if (headerText.includes('nice to have') || headerText.includes('preferred') || headerText.includes('bonus') || headerText.includes('skills')) {
            result.tags = extractBullets($, parent);
        }
        if (headerText.includes('about the role') || headerText.includes('about this') || headerText.includes('overview') || headerText.includes('about the opportunity')) {
            // Lever sometimes puts description directly under the header
            let descText = '';
            let curr = parent.next();
            while (curr.length > 0 && !curr.is('h2, h3, h4, ul') && !curr.find('strong, b').length) {
                descText += curr.text().trim() + '\n\n';
                curr = curr.next();
            }
            if (descText) result.description = descText.trim().slice(0, 2000);
        }
    });

    // Lever often has plain text before any headers for the description
    if (!result.description) {
        let desc = '';
        $('.posting-requirements').first().prevAll('div').each((_, div) => {
            desc = $(div).text().trim() + '\n\n' + desc;
        });
        if (desc.length > 50) result.description = desc.trim().slice(0, 2000);
    }

    return result;
}

// ─── Generic Scraper ─────────────────────────────────────────────────────────

function scrapeGeneric($: cheerio.CheerioAPI): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    result.title = $('h1').first().text().trim() || $('title').text().replace(/Job Application for/i, '').split(' at ')[0].split('|')[0].trim();

    const fullText = $('body').text();

    $('h2, h3, h4, b, strong').each((_, el) => {
        const headerText = $(el).text().toLowerCase().trim();
        const parent = $(el).is('strong, b') ? $(el).parent() : $(el);

        if (headerText.includes('responsibilit') || headerText.includes("you'll do") || headerText.includes('key duties')) {
            result.responsibilities = extractBullets($, parent);
        }
        if (headerText.includes('requirement') || headerText.includes('qualification') || headerText.includes('looking for') || headerText.includes('must have')) {
            result.requirements = extractBullets($, parent);
        }
        if (headerText.includes('nice to have') || headerText.includes('preferred') || headerText.includes('bonus') || headerText.includes('tech stack')) {
            result.tags = extractBullets($, parent);
        }
        if (headerText === 'about the role' || headerText === 'job description' || headerText === 'overview') {
            let descText = '';
            let curr = parent.next();
            while (curr.length > 0 && !curr.is('h2, h3, h4') && !curr.is('ul')) {
                descText += curr.text().trim() + '\n\n';
                curr = curr.next();
            }
            if (descText) result.description = descText.trim().slice(0, 2000);
        }
    });

    // Fallback tech skill spotting
    if (result.tags.length === 0) {
        const knownSkills = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
            'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Jenkins', 'GitHub Actions',
            'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
            'HTML', 'CSS', 'Tailwind', 'Figma', 'Selenium', 'JUnit', 'PyTest',
            'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
            'Linux', 'Agile', 'Scrum', 'Microservices',
        ];
        result.tags = knownSkills.filter(skill =>
            fullText.toLowerCase().includes(skill.toLowerCase())
        ).slice(0, 10);
    }

    return result;
}

// ─── URL Blocklist ─────────────────────────────────────────────────────────
// These domains will NEVER contain scrapeable job detail pages.
// Short-link redirectors, WhatsApp, Google Forms, social media safety warnings.
// Always skip them before making any HTTP / AI call.
const UNSCRAPPABLE_HOSTNAMES = new Set([
    'bit.ly', 'tinyurl.com', 'lnkd.in', 't.co', 'ow.ly', 'buff.ly',
    'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc',
    'whatsapp.com', 'wa.me',
    'docs.google.com',          // Google Forms / Docs — never job pages
    'forms.gle',
    't.me',                     // Telegram links
    'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
]);

// Any URL whose PATH starts with these segments is also junk.
const UNSCRAPPABLE_PATH_PREFIXES = [
    '/safety/go',               // linkedin.com/safety/go redirect
    '/channel/',                // WhatsApp broadcast channels
];

function isUnscrappable(url: string): boolean {
    try {
        const { hostname, pathname } = new URL(url);
        if (UNSCRAPPABLE_HOSTNAMES.has(hostname)) return true;
        if (UNSCRAPPABLE_PATH_PREFIXES.some(p => pathname.startsWith(p))) return true;
    } catch { return true; } // malformed URL — skip
    return false;
}

// ─── URL Fetcher ────────────────────────────────────────────────────────────

import { aiScrapeJob } from './ai-scraper';

export async function deepScrapeJob(url: string): Promise<ScrapedJob> {
    if (!url || isUnscrappable(url)) return { ...EMPTY_RESULT };

    try {
        const { data: html } = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            maxRedirects: 5,
        });

        const $ = cheerio.load(html);
        let portalType = 'generic';

        const hostname = new URL(url).hostname.toLowerCase();
        const matches = (target: string) => hostname === target || hostname.endsWith('.' + target);

        if (matches('greenhouse.io') || html.includes('greenhouse')) portalType = 'greenhouse';
        else if (matches('lever.co') || html.includes('lever-jobs')) portalType = 'lever';
        else if (matches('linkedin.com')) portalType = 'linkedin';

        console.log(`🔍 [Scraper] Portal: ${portalType} | URL: ${url.slice(0, 60)}...`);

        let scrapeResult: ScrapedJob;
        switch (portalType) {
            case 'greenhouse':
                scrapeResult = scrapeGreenhouse($);
                break;
            case 'lever':
                scrapeResult = scrapeLever($);
                break;
            default:
                scrapeResult = scrapeGeneric($);
                break;
        }

        // --- AI FALLBACK ---
        // Only use Gemini if Cheerio failed AND this looks like a real job portal
        // (not a JS-heavy SPA like Workday/Oracle which Cheerio can never parse).
        const jsHeavyHosts = [
            'myworkdayjobs.com', 'oraclecloud.com', 'eightfold.ai',
            'avature.net', 'njoyn.com', 'taleo.net',
            'apply.careers.microsoft.com', 'careers.mastercard.com',
            'careers.qualcomm.com', 'careers.wipro.com',
            'jobs.volvogroup.com', 'usijobs.deloitte.com',
            'salesforce.wd12.myworkdayjobs.com', 'thomsonreuters.wd5.myworkdayjobs.com',
        ];
        const isJsHeavy = jsHeavyHosts.some(h => hostname === h || hostname.endsWith('.' + h));

        if (!isJsHeavy && (scrapeResult.responsibilities.length === 0 || scrapeResult.requirements.length === 0)) {
            const rawText = $('body').text() || html;
            scrapeResult = await aiScrapeJob(rawText, url, scrapeResult);
        }

        return scrapeResult;
    } catch (err: any) {
        console.warn(`⚠️ [Scraper] Failed: ${url.slice(0, 50)} — ${err.message}`);
        return { ...EMPTY_RESULT };
    }
}
