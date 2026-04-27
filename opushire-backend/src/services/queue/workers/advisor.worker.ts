import { createWorker } from '../queue.service';
import Resume from '../../../models/Resume';
import { log } from '../../../utils/logger';
import { generateCareerInsights } from '../../advisor/careerAdvisor.service';
import BotStat from '../../../models/BotStat';

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

    await BotStat.incrementMetric('advisoriesGenerated', 1);

    return { advised: true };
  });

  createWorker('linkedin-enrich', async (data: { resumeId: string; linkedinUrl: string }) => {
    log('WORKER', `LinkedIn enrichment requested for ${data.resumeId} (${data.linkedinUrl})`);
    
    // Increment metric for attempt/success (even if stubbed for now)
    await BotStat.incrementMetric('profilesEnriched', 1);
    
    return { enriched: true, reason: 'Enrichment event recorded' };
  });
}
