import { SKILL_MAP } from './skillDictionary';
import { ruleNormalize } from './skillRules';
import { canonicalizeSkillsAI } from '../services/ai/skill.canonicalizer';

function clean(s: string): string {
    return s.toLowerCase().trim();
}

export async function normalizeSkills(skills: string[] = []): Promise<string[]> {
    if (!skills || skills.length === 0) return [];
    
    // 1. Dictionary Mapping (Fast Regex/Exact Match)
    let out = skills.map(s => {
        const cleaned = clean(s);
        return SKILL_MAP[cleaned] || s;
    });

    // 2. Rule-based cleaning (Title casing, spacing fixes)
    out = out.map(ruleNormalize);

    // 3. AI Canonicalization (Deep semantic fixing)
    out = await canonicalizeSkillsAI(out);

    // 4. Deduplicate
    return [...new Set(out)];
}
