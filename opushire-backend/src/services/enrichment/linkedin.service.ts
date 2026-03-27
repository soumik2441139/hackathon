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
        
        // Pick the hostname from an explicit allow-list instead of constructing it directly from user input (SSRF mitigation)
        let finalHostname = 'www.linkedin.com';
        if (hostname === 'linkedin.com') finalHostname = 'linkedin.com';
        else if (hostname !== 'www.linkedin.com' && !hostname.endsWith('.linkedin.com')) {
            throw new Error('Unauthorized SSRF target: only linkedin.com is allowed');
        } else {
            // For other valid subdomains (e.g. uk.linkedin.com), use the validated string safely
            finalHostname = hostname;
        }
        
        const safeUrl = `https://${finalHostname}${validatedUrl.pathname}${validatedUrl.search}`;
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
