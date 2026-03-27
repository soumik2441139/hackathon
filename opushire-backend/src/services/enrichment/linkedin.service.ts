import axios from 'axios';
import * as cheerio from 'cheerio';
import { assertSafePublicUrl } from '../../utils/urlSafety';

interface LinkedInEnrichment {
    certifications: string[];
    linkedin: string;
    headline?: string;
}

/**
 * Extracts public profile data from a LinkedIn public profile URL
 * by scraping the publicly-visible HTML (no LinkedIn API key needed).
 * Falls back gracefully if the profile is private or unreachable.
 */
export async function extractLinkedInProfile(url: string): Promise<LinkedInEnrichment> {
    const result: LinkedInEnrichment = { certifications: [], linkedin: url };

    if (!url || !url.includes('linkedin.com/in/')) {
        return result;
    }

    try {
        const validatedUrl = await assertSafePublicUrl(url, ['http:', 'https:']);
        const hostname = validatedUrl.hostname.toLowerCase();
        
        // Only allow LinkedIn public profile URLs under linkedin.com
        if (hostname !== 'www.linkedin.com' && hostname !== 'linkedin.com' && !hostname.endsWith('.linkedin.com')) {
            throw new Error('Unauthorized SSRF target: only linkedin.com is allowed');
        }

        // Extract the LinkedIn profile slug from the path, enforcing a tight allow-list
        // Examples of supported paths: /in/john-doe-123456/ or /in/john-doe-123456
        const path = validatedUrl.pathname || '';
        const match = path.match(/^\/in\/([^/]+)(?:\/.*)?$/);
        if (!match) {
            // Not a standard public profile URL — do not perform any outbound request
            return result;
        }

        const rawSlug = match[1].trim();
        // Allow only safe characters in the slug (letters, numbers, dashes) and a reasonable length
        if (!/^[a-zA-Z0-9-]{3,100}$/.test(rawSlug)) {
            return result;
        }

        const encodedSlug = encodeURIComponent(rawSlug);

        // Use a canonical LinkedIn host and drop any user-controlled query string (SSRF mitigation)
        const safeUrl = `https://www.linkedin.com/in/${encodedSlug}/`;
        const { data: html } = await axios.get(safeUrl, {
            timeout: 12000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            maxRedirects: 3,
        });

        const $ = cheerio.load(html);

        // Extract headline (often visible even on public profiles)
        const headline = $('h2.top-card-layout__headline, .top-card__subline-item').first().text().trim();
        if (headline) result.headline = headline;

        // Extract certifications from the public profile HTML
        // LinkedIn public profiles expose certification sections in structured markup
        const certSections = $('section').filter((_, el) => {
            const heading = $(el).find('h2, h3').first().text().toLowerCase();
            return heading.includes('certification') || heading.includes('license');
        });

        certSections.find('h3, .profile-section-card__title, li h3').each((_, el) => {
            const certName = $(el).text().trim();
            if (certName && certName.length > 2 && certName.length < 150) {
                result.certifications.push(certName);
            }
        });

        // Also check for structured data (JSON-LD) which LinkedIn sometimes includes
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const jsonData = JSON.parse($(el).html() || '{}');
                if (jsonData['@type'] === 'Person' && Array.isArray(jsonData.hasCredential)) {
                    for (const cred of jsonData.hasCredential) {
                        const name = cred.name || cred.credentialCategory;
                        if (name && !result.certifications.includes(name)) {
                            result.certifications.push(name);
                        }
                    }
                }
            } catch {
                // JSON parse failed, skip
            }
        });

        console.log(`[LinkedIn] Extracted ${result.certifications.length} certifications from ${url}`);
    } catch (err: any) {
        console.warn(`[LinkedIn] Scrape failed for ${url}: ${err.message}`);
    }

    return result;
}
