import { IResume, IParsedData } from '../../models/Resume';

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

export function scoreResume(resumeDoc: IResume): { score: number, reasons: string[] } {
    const p: IParsedData = resumeDoc.parsedData || {
        name: null, skills: [], education: [], projects: [], experience_level: null, domains: []
    };
    const extra: any = resumeDoc.extraData || {};

    let score = 0;
    const reasons: string[] = [];

    // Skills depth
    const skillScore = clamp((p.skills?.length || 0) * 3, 0, 30);
    score += skillScore;
    if (skillScore > 0) reasons.push(`Technical Skills depth: +${skillScore}`);

    // Project strength
    const projScore = clamp((p.projects?.length || 0) * 6, 0, 30);
    score += projScore;
    if (projScore > 0) reasons.push(`Project portfolio strength: +${projScore}`);

    // Experience/Level bonuses
    if (p.experience_level === "intern") {
        score += 10;
        reasons.push("Internship experience identified: +10");
    }

    // Education
    if (p.education?.length) {
        score += 10;
        reasons.push("Formal education listed: +10");
    }

    // Domain clarity
    if (p.domains?.length) {
        score += 10;
        reasons.push("Domain expertise distinct: +10");
    }

    // Certifications (From extra data schema)
    if (extra.certifications?.length) {
        score += 5;
        reasons.push("Relevant certifications: +5");
    }

    // Profile completeness metric
    const filledCount =
        (p.skills?.length ? 1 : 0) +
        (p.projects?.length ? 1 : 0) +
        (p.education?.length ? 1 : 0) +
        (p.domains?.length ? 1 : 0);

    const compScore = filledCount * 2.5;
    score += compScore;
    if (compScore > 0) reasons.push(`Base completeness framework: +${compScore}`);

    return {
        score: Math.round(clamp(score, 0, 100)),
        reasons
    };
}
