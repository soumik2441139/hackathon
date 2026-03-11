import Job, { IJob } from '../../models/Job';
import { IResume } from '../../models/Resume';

function diffSkills(user: string[] = [], required: string[] = []): string[] {
    const u = new Set(user.map(s => s.toLowerCase()));
    return required.filter(s => !u.has(s.toLowerCase()));
}

interface LearningStep {
    skill: string;
    steps: string[];
}

function buildLearningPath(gaps: string[] = []): LearningStep[] {
    return gaps.map(skill => ({
        skill,
        steps: [
            `Learn ${skill} fundamentals`,
            `Build a project using ${skill}`,
            `Add ${skill} to resume`
        ]
    }));
}

export async function generateCareerInsights(resume: IResume): Promise<{ gaps: string[], learningPath: LearningStep[] } | null> {
    const skills = resume.parsedData?.skills || [];

    const jobId = resume.matches?.[0]?.job;
    if (!jobId) return null;

    const job = await Job.findById(jobId) as IJob | null;
    if (!job) return null;

    const gaps = diffSkills(skills, job.skills || []);
    const learningPath = buildLearningPath(gaps);

    return { gaps, learningPath };
}
