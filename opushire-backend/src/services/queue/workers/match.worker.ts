import { createWorker, enqueue } from '../queue.service';
import Resume from '../../../models/Resume';
import JobModel from '../../../models/Job';
import { User, type IUser } from '../../../models/User';
import { getMatches } from '../../matching/match.service';
import { embedText } from '../../ai/embedding.service';
import { VectorDB } from '../../vector.service';
import BotStat from '../../../models/BotStat';

export function registerMatchWorker() {
  createWorker('match-resumes', async (data: { resumeId: string }) => {
    const resume = await Resume.findById(data.resumeId);
    if (!resume || !resume.parsedData || resume.matched) return { skipped: true };

    const matches = await getMatches(resume.rawText, resume.parsedData);
    resume.matches = matches;
    resume.matched = true;
    await resume.save();

    if (matches.length > 0) {
      await (BotStat as any).incrementMetric('resumesMatched', 1);
    }

    await enqueue('career-advisor', 'advise', { resumeId: data.resumeId });
    return { matched: matches.length };
  });

  createWorker('match-candidates', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job || job.isArchived) return { skipped: true };

    const jobText = `${job.title} ${(job as any).verifiedTags?.join(', ') || ''} ${job.company}`;
    let jobEmbedding: number[];
    try {
      jobEmbedding = await embedText(jobText);
    } catch {
      return { failed: true, reason: 'Embedding generation failed' };
    }

    const results = await VectorDB.searchResumes(jobEmbedding, 10);
    let notificationsTriggered = 0;

    for (const result of results) {
      if (result.score < 0.8) continue; 
      const resumeId = result.id;
      const resume = await Resume.findById(resumeId).populate('userId');
      if (!resume || !resume.userId) continue;

      const user = resume.userId as unknown as IUser;
      if (user.emailedJobs?.some((id: any) => id.toString() === job._id.toString())) continue;

      await enqueue('email-notifications', 'dispatch', {
        userId: user._id, email: user.email, name: user.name,
        jobId: job._id, jobTitle: job.title, company: job.company, matchScore: Math.round(result.score * 100)
      });

      await User.findByIdAndUpdate(user._id, { $addToSet: { emailedJobs: job._id } });
      notificationsTriggered++;
    }

    if (notificationsTriggered > 0) {
      await (BotStat as any).incrementMetric('resumesMatched', notificationsTriggered);
    }

    return { candidatesScanned: results.length, notificationsTriggered };
  });
}
