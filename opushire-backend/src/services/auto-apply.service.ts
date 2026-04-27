import puppeteer from 'puppeteer';
import { Job } from '../models/Job';
import { User } from '../models/User';
import Resume from '../models/Resume';
import { assertSafePublicUrl } from '../utils/urlSafety';
import { log, logError } from '../utils/logger';

// Trusted portals where auto-submit is allowed
const SUBMIT_ALLOWLIST = [
    'greenhouse.io',
    'lever.co',
    'jobs.lever.co',
    'boards.greenhouse.io',
    'myworkdayjobs.com',
];

function isSubmitAllowed(url: string): boolean {
    if (process.env.AUTO_APPLY_SUBMIT !== 'true') return false;
    try {
        const hostname = new URL(url).hostname;
        return SUBMIT_ALLOWLIST.some(domain => hostname.endsWith(domain));
    } catch {
        return false;
    }
}

export async function autoApplyToJob(jobId: string, userId: string) {
    const job = await Job.findById(jobId);
    if (!job || !job.externalUrl) throw new Error('Job or external URL not found');

    const safeExternalUrl = (await assertSafePublicUrl(job.externalUrl, ['http:', 'https:'])).toString();

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Fetch resume for file upload support
    const resume = await Resume.findOne({ userId: user._id });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(20000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36');

        log('AUTO_APPLY', `Navigating to ${safeExternalUrl}...`);
        await page.goto(safeExternalUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        log('AUTO_APPLY', `Attempting to fill application form for ${user.name}...`);

        const phone = user.phone || '';
        const linkedin = user.linkedin || `https://linkedin.com/in/${user.name.split(' ')[0].toLowerCase()}`;

        await page.evaluate((userData) => {
            const getField = (selectors: string[]) => {
                for (const selector of selectors) {
                    const el = document.querySelector(selector) as HTMLInputElement;
                    if (el && !el.disabled && el.type !== 'hidden') return el;
                }
                return null;
            };

            const fillIfFound = (selectors: string[], value: string) => {
                const el = getField(selectors);
                if (el) {
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            const names = userData.name.split(' ');
            const firstName = names[0];
            const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

            fillIfFound([
                'input[name*="first" i]', 'input[id*="first" i]',
                'input[placeholder*="first name" i]'
            ], firstName);

            fillIfFound([
                'input[name*="last" i]', 'input[id*="last" i]',
                'input[placeholder*="last name" i]'
            ], lastName);

            fillIfFound([
                'input[name="name" i]', 'input[id="name" i]', 'input[name="fullname" i]'
            ], userData.name);

            fillIfFound([
                'input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'
            ], userData.email);

            fillIfFound([
                'input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]', 'input[name*="mobile" i]'
            ], userData.phone);

            fillIfFound([
                'input[name*="linkedin" i]', 'input[id*="linkedin" i]', 'input[name*="website" i]', 'input[name*="portfolio" i]'
            ], userData.linkedin);

        }, { name: user.name, email: user.email, phone, linkedin });

        // Attempt resume file upload if a resume file input exists
        if (resume?.fileUrl) {
            const fileInputs = await page.$$('input[type="file"]');
            if (fileInputs.length > 0) {
                log('AUTO_APPLY', 'Resume file input detected — skipping file upload (CDN-hosted resume).');
            }
        }

        await new Promise(r => setTimeout(r, 2500));

        const canSubmit = isSubmitAllowed(safeExternalUrl);

        if (canSubmit) {
            // Only submit on trusted ATS portals with env flag enabled
            const submitted = await page.evaluate(() => {
                const btn = document.querySelector(
                    'button[type="submit"], input[type="submit"], button[data-qa="btn-submit"]'
                ) as HTMLElement | null;
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (submitted) {
                await new Promise(r => setTimeout(r, 3000));
                log('AUTO_APPLY', 'Application submitted on allowlisted ATS.');
                return { success: true, message: 'Application auto-filled and submitted.' };
            }
        }

        log('AUTO_APPLY', `Form populated successfully. Submit ${canSubmit ? 'button not found' : 'disabled (set AUTO_APPLY_SUBMIT=true for allowlisted portals)'}.`);
        return { success: true, message: 'Auto-fill completed. Manual submit required for this portal.' };
    } catch (err: any) {
        logError('AUTO_APPLY', `Error: ${err.message}`, err);
        throw new Error(`Auto-Apply failed: ${err.message}`);
    } finally {
        await browser.close();
    }
}
