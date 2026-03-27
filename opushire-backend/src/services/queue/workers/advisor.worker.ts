import { createWorker } from '../queue.service';
import Resume from '../../../models/Resume';
import { log } from '../../../utils/logger';
import { generateCareerInsights } from '../../advisor/careerAdvisor.service';

export function registerAdvisorWorker() {
  createWorker('career-advisor', async (data: { resumeId: string }) => {
    const resume = await Resume.findById(data.resumeId);
    if (!resume || !resume.matched) return { skipped: true };
    if (resume.extraData?.learningPath) return { skipped: true, reason: 'Already advised' };

    const insights = await generateCareerInsights(resume);
    if (!insights) return { noInsights: true };

    resume.extraData = resume.extraData || {};
    resume.extraData.skillGaps = insights.gaps;
    resume.extraData.learningPath = insights.learningPath;
    resume.markModified('extraData');
    await resume.save();

    return { advised: true };
  });

  createWorker('linkedin-enrich', async (data: { resumeId: string; linkedinUrl: string }) => {
    log('WORKER', `LinkedIn enrichment requested for ${data.resumeId} (${data.linkedinUrl})`);
    return { enriched: false, reason: 'Enrichment stub' };
  });
}
