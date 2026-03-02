import axios from 'axios';

/**
 * Deep Job Portal Scraper — visits the actual career page and
 * extracts structured data: description, responsibilities, requirements, tags.
 *
 * Supports:
 *   ✅ Greenhouse (greenhouse.io)
 *   ✅ Lever (lever.co, jobs.lever.co)
 *   ✅ LinkedIn (linkedin.com/jobs)
 *   ✅ Generic career pages (regex-based fallback)
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

// ─── HTML → Clean Text ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/?(p|div|h[1-6]|tr|td|section|article)[^>]*>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractBullets(text: string): string[] {
    return text
        .split(/\n/)
        .map(l => l.replace(/^[\s•\-\*▪▸►●○◆→✓✔]+\s*/, '').trim())
        .filter(l => l.length > 5 && l.length < 300);
}

// ─── Greenhouse Scraper ─────────────────────────────────────────────────────

function scrapeGreenhouse(text: string): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    // Greenhouse uses ### headings in its content
    const sections = text.split(/#{2,3}\s+/);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const lower = section.slice(0, 80).toLowerCase();

        // Description: "About the Role" or "About the Position"
        if (lower.includes('about the role') || lower.includes('about the position') || lower.includes('about this')) {
            const body = section.replace(/^[^\n]+\n/, '').trim();
            result.description = body.slice(0, 2000);
        }

        // Responsibilities: "What You'll Do", "Responsibilities", "Key Responsibilities"
        if (lower.includes("you'll do") || lower.includes("what you will do") || lower.includes('responsibilities') || lower.includes('your role')) {
            result.responsibilities = extractBullets(section.replace(/^[^\n]+\n/, ''));
        }

        // Requirements: "What We're Looking For", "Requirements", "Qualifications", "Must Have"
        if (lower.includes('looking for') || lower.includes('requirements') || lower.includes('qualifications') || lower.includes('must have') || lower.includes('what you need')) {
            result.requirements = extractBullets(section.replace(/^[^\n]+\n/, ''));
        }

        // Tags/Skills: "Nice to Have", "Preferred", "Bonus", "Tech Stack"
        if (lower.includes('nice to have') || lower.includes('preferred') || lower.includes('bonus') || lower.includes('tech stack') || lower.includes('will learn')) {
            result.tags = extractBullets(section.replace(/^[^\n]+\n/, ''));
        }

        // Title from first section
        if (i === 0) {
            const titleMatch = section.match(/^(.+?)(?:\n|$)/);
            if (titleMatch) result.title = titleMatch[1].trim().slice(0, 100);
        }

        // Company from "About {Company}" section
        if (lower.startsWith('about ') && !lower.includes('role') && !lower.includes('position') && !lower.includes('this')) {
            const companyMatch = section.match(/^About\s+(.+?)(?:\n|$)/i);
            if (companyMatch) result.company = companyMatch[1].trim();
        }
    }

    // Salary extraction
    const salaryMatch = text.match(/(?:salary|compensation|ctc|stipend)\s*[:\-–]?\s*(.{5,60}?)(?:\n|$)/i);
    if (salaryMatch) result.salary = salaryMatch[1].trim();

    // Location from OG or content
    const locMatch = text.match(/(?:📍|location)\s*[:\-]?\s*(.+?)(?:\n|$)/i);
    if (locMatch) result.location = locMatch[1].trim();

    return result;
}

// ─── Lever Scraper ──────────────────────────────────────────────────────────

function scrapeLever(text: string): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    // Lever uses similar heading patterns
    const sections = text.split(/(?:^|\n)(?:#{1,3}\s+|\*\*)/m);

    for (const section of sections) {
        const lower = section.slice(0, 80).toLowerCase();

        if (lower.includes("you'll do") || lower.includes('responsibilities') || lower.includes('in this role')) {
            result.responsibilities = extractBullets(section);
        }
        if (lower.includes('requirements') || lower.includes('qualifications') || lower.includes('looking for') || lower.includes('what you need')) {
            result.requirements = extractBullets(section);
        }
        if (lower.includes('nice to have') || lower.includes('preferred') || lower.includes('bonus')) {
            result.tags = extractBullets(section);
        }
        if (lower.includes('about the role') || lower.includes('about this') || lower.includes('overview')) {
            result.description = section.replace(/^[^\n]+\n/, '').trim().slice(0, 2000);
        }
    }

    // Title from first line
    const titleLine = text.split('\n').find(l => l.trim().length > 0);
    if (titleLine) result.title = titleLine.replace(/^#\s+/, '').trim().slice(0, 100);

    return result;
}

// ─── Generic Scraper (works for most career pages) ───────────────────────────

function scrapeGeneric(text: string): ScrapedJob {
    const result = { ...EMPTY_RESULT };

    // Split by headings (various formats)
    const sections = text.split(/(?:^|\n)(?:#{1,4}\s+|\*\*[A-Z])/m);

    for (const section of sections) {
        const lower = section.slice(0, 100).toLowerCase();

        // Description
        if (lower.includes('about') && (lower.includes('role') || lower.includes('position') || lower.includes('job') || lower.includes('opportunity'))) {
            result.description = section.replace(/^[^\n]+\n/, '').trim().slice(0, 2000);
        }

        // Responsibilities
        if (lower.includes('responsibilit') || lower.includes("you'll do") || lower.includes('you will do') || lower.includes('key duties') || lower.includes('your role')) {
            result.responsibilities = extractBullets(section);
        }

        // Requirements
        if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('looking for') || lower.includes('must have') || lower.includes('what you need') || lower.includes('who you are') || lower.includes('ideal candidate')) {
            result.requirements = extractBullets(section);
        }

        // Tags / Nice-to-have
        if (lower.includes('nice to have') || lower.includes('preferred') || lower.includes('bonus') || lower.includes('tech stack') || lower.includes('tools') || lower.includes('skills')) {
            const bullets = extractBullets(section);
            if (bullets.length > 0) result.tags = bullets;
        }
    }

    // Try keyword-spotting for tech skills if tags are empty
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
            text.toLowerCase().includes(skill.toLowerCase())
        ).slice(0, 10);
    }

    // Title
    const titleLine = text.split('\n').find(l => l.trim().length > 3);
    if (titleLine) result.title = titleLine.replace(/^#\s+/, '').trim().slice(0, 100);

    // Salary
    const salaryMatch = text.match(/(?:salary|compensation|ctc|stipend|package)\s*[:\-–]?\s*(.{5,60}?)(?:\n|$)/i);
    if (salaryMatch) result.salary = salaryMatch[1].trim();

    // Location
    const locMatch = text.match(/(?:location|📍)\s*[:\-]?\s*(.+?)(?:\n|$)/i);
    if (locMatch) result.location = locMatch[1].trim();

    return result;
}

// ─── URL Fetcher ────────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<{ text: string; portalType: string }> {
    const { data: html } = await axios.get(url, {
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        maxRedirects: 5,
    });

    const text = stripHtml(html);
    let portalType = 'generic';

    if (url.includes('greenhouse.io') || html.includes('greenhouse')) portalType = 'greenhouse';
    else if (url.includes('lever.co') || html.includes('lever-jobs')) portalType = 'lever';
    else if (url.includes('linkedin.com')) portalType = 'linkedin';

    return { text, portalType };
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function deepScrapeJob(url: string): Promise<ScrapedJob> {
    if (!url || url.includes('t.me')) return { ...EMPTY_RESULT };

    try {
        const { text, portalType } = await fetchPageText(url);

        console.log(`🔍 [Scraper] Portal: ${portalType} | URL: ${url.slice(0, 60)}...`);

        switch (portalType) {
            case 'greenhouse':
                return scrapeGreenhouse(text);
            case 'lever':
                return scrapeLever(text);
            default:
                return scrapeGeneric(text);
        }
    } catch (err: any) {
        console.warn(`⚠️ [Scraper] Failed: ${url.slice(0, 50)} — ${err.message}`);
        return { ...EMPTY_RESULT };
    }
}
