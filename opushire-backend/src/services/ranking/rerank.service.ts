import { IJob } from '../../models/Job';
import { IParsedData } from '../../models/Resume';

// Helper to calculate overlap without calling the async AI canonicalizer during real-time ranking
function overlap(userSkills: string[] = [], jobSkills: string[] = []): number {
    const jobSet = new Set(jobSkills.map(x => x.toLowerCase()));
    return userSkills.filter(x => jobSet.has(x.toLowerCase())).length;
}

export interface IRerankedJob {
    job: IJob;
    score: number;
}

export function rerank(jobs: IJob[], candidate: IParsedData): IRerankedJob[] {
    return jobs.map(job => {
        let score = 0;

        // 1. Skill Overlap (+10 per matched normalized skill)
        const matchedSkillsCount = overlap(candidate.skills, job.skills);
        score += matchedSkillsCount * 10;

        // 2. Experience Level Match (+10)
        if (job.level && candidate.experience_level) {
            if (job.level.toLowerCase() === candidate.experience_level.toLowerCase()) {
                score += 10;
            }
        }

        // 3. Domain Match (+6 per aligned domain)
        if (job.domains && candidate.domains) {
            const domainOverlap = overlap(candidate.domains, job.domains);
            score += domainOverlap * 6;
        }

        // 4. Recency Boost (Jobs posted recently)
        const jobDate = job.createdAt || new Date();
        const daysOld = (Date.now() - new Date(jobDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysOld <= 7) {
            score += 10;
        } else if (daysOld <= 30) {
            score += 5;
        }

        return { job, score };
    }).sort((a, b) => b.score - a.score);
}
