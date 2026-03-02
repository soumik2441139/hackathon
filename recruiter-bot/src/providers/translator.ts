import axios from 'axios';
import { NormalizedJob } from './remotive.provider';

/**
 * Auto-Translator for non-English job posts.
 *
 * Uses MyMemory Translation API — completely free, no API key needed.
 * https://mymemory.translated.net/doc/spec.php
 *
 * Detects language automatically, translates title + description to English.
 */

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// Common non-English characters/words to detect language
const LANG_HINTS: Record<string, RegExp> = {
    de: /\b(und|oder|für|mit|bei|zur|das|die|der|ein|von|ist|wir|als|auf|aus|nicht|sich|haben|werden|kann|auch|nach|über|ihre?|diese?r?|müssen|arbeiten|suchen|erfahrung|stelle|aufgaben|anforderungen|bewerbung|unternehmen|entwickler|praktikum|werkstudent)\b/i,
    fr: /\b(et|ou|pour|avec|les|des|une?|est|nous|dans|par|sur|vous|qui|sont|aux|ces|cette|peut|aussi|votre|notre|travail|expérience|poste|entreprise|recherche|développeur|stage|candidature|mission|compétences)\b/i,
    es: /\b(y|o|para|con|los|las|una?|del|por|que|son|está|también|puede|sobre|pero|como|más|desde|hasta|empresa|trabajo|experiencia|puesto|desarrollador|pasantía)\b/i,
    pt: /\b(e|ou|para|com|dos|das|uma?|por|que|são|está|também|pode|sobre|mas|como|mais|desde|até|empresa|trabalho|experiência|desenvolvedor|estágio)\b/i,
    nl: /\b(en|of|voor|met|het|een|van|zijn|wij|bij|ook|deze|kan|niet|naar|over|ons|werk|ervaring|bedrijf|ontwikkelaar|stage|functie)\b/i,
};

function detectLanguage(text: string): string | null {
    const sample = text.slice(0, 500).toLowerCase();

    // Score each language
    let bestLang: string | null = null;
    let bestScore = 0;

    for (const [lang, pattern] of Object.entries(LANG_HINTS)) {
        const matches = sample.match(new RegExp(pattern.source, 'gi'));
        const score = matches ? matches.length : 0;
        if (score > bestScore && score >= 3) { // Need at least 3 keyword matches
            bestScore = score;
            bestLang = lang;
        }
    }

    return bestLang;
}

async function translateText(text: string, fromLang: string): Promise<string> {
    if (!text || text.length < 5) return text;

    // MyMemory has a 500 char limit per request — split if needed
    const chunks: string[] = [];
    const maxLen = 450;

    if (text.length <= maxLen) {
        chunks.push(text);
    } else {
        // Split on sentence boundaries
        const sentences = text.split(/(?<=[.!?\n])\s+/);
        let current = '';
        for (const sentence of sentences) {
            if ((current + ' ' + sentence).length > maxLen && current) {
                chunks.push(current);
                current = sentence;
            } else {
                current = current ? current + ' ' + sentence : sentence;
            }
        }
        if (current) chunks.push(current);
    }

    const translated: string[] = [];
    for (const chunk of chunks) {
        try {
            const { data } = await axios.get(MYMEMORY_API, {
                params: {
                    q: chunk,
                    langpair: `${fromLang}|en`,
                },
                timeout: 8000,
            });

            if (data.responseStatus === 200 && data.responseData?.translatedText) {
                translated.push(data.responseData.translatedText);
            } else {
                translated.push(chunk); // Fallback to original
            }
        } catch {
            translated.push(chunk); // Fallback to original
        }
    }

    return translated.join(' ');
}

export async function translateJobs(jobs: NormalizedJob[]): Promise<NormalizedJob[]> {
    let translatedCount = 0;

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const textSample = `${job.title} ${job.description}`;
        const lang = detectLanguage(textSample);

        if (!lang) continue; // Already English

        console.log(`🌐 [Translator] Translating job ${i + 1}: "${job.title.slice(0, 40)}..." (${lang} → en)`);

        try {
            const [translatedTitle, translatedDesc] = await Promise.all([
                translateText(job.title, lang),
                translateText(job.description.slice(0, 1500), lang),
            ]);

            jobs[i] = {
                ...job,
                title: translatedTitle,
                description: translatedDesc,
            };
            translatedCount++;
        } catch {
            // Keep original if translation fails
        }
    }

    if (translatedCount > 0) {
        console.log(`🌐 [Translator] Translated ${translatedCount} non-English jobs to English`);
    }

    return jobs;
}
