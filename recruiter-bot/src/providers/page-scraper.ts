import axios from 'axios';
import { NormalizedJob } from './remotive.provider';

/**
 * Career Page Scraper
 * Visits the apply link to extract skills/requirements from the actual career page.
 */
export async function scrapeCareerPage(url: string): Promise<{ skills: string[]; description: string }> {
    const result = { skills: [] as string[], description: '' };
    if (!url || url.includes('t.me')) return result;

    try {
        const { data: html } = await axios.get(url, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            maxRedirects: 3,
        });

        const text = stripHtml(html);

        // Extract skills from common patterns
        const skillPatterns = [
            /(?:skills?\s*(?:required|needed)?|requirements?|qualifications?|must[\s-]?have|what\s+you.+?(?:need|bring)|tech[\s-]?stack)\s*[:\-–]?\s*([\s\S]{30,800}?)(?:\n\n|\r\n\r\n|responsibilities|about\s+(?:us|the)|benefits|how\s+to\s+apply|what\s+we\s+offer)/gi,
        ];

        for (const pattern of skillPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const lines = match[1]
                    .split(/[\n•\-\*▪▸►●○◆]/)
                    .map(l => l.trim())
                    .filter(l => l.length > 3 && l.length < 150);
                result.skills = lines.slice(0, 8);
                break;
            }
        }

        // Extract common tech skills via keyword spotting
        if (result.skills.length === 0) {
            const knownSkills = [
                'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
                'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
                'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
                'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
                'HTML', 'CSS', 'Tailwind', 'SASS', 'Figma',
                'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
                'Linux', 'Agile', 'Scrum', 'Jira',
            ];
            const found = knownSkills.filter(skill =>
                text.toLowerCase().includes(skill.toLowerCase())
            );
            result.skills = found.slice(0, 8);
        }

        // Extract a clean description snippet
        const descMatch = text.match(
            /(?:about\s+(?:the\s+)?(?:role|position|job)|job\s+description|what\s+you.+?do|overview)\s*[:\-–]?\s*([\s\S]{50,500}?)(?:\n\n|requirements?|qualifications?|skills?)/i
        );
        if (descMatch && descMatch[1]) {
            result.description = descMatch[1].trim();
        }
    } catch {
        // Silently fail — many career pages block scraping
    }

    return result;
}

function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(p|div|li|h[1-6]|tr|td)[^>]*>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
