import { embedText } from '../ai/embedding.service';
import { addVector } from './faiss.store';
import { normalizeSkills } from '../../utils/skillNormalizer';
import { IJob } from '../../models/Job';
import { log, logError } from '../../utils/logger';

export async function autoEmbedJob(job: IJob): Promise<void> {
    try {
        const skills = await normalizeSkills(job.skills || []);

        const text = `
    Job Title: ${job.title}
    Description: ${job.description}
    Required Skills: ${skills.join(", ")}
    Experience Level: ${job.level}
    Industry Domains: ${job.domains?.join(", ") || ''}
  `;

        const vector = await embedText(text);
        addVector(job._id.toString(), vector);
        
        log('FAISS', `Job ${job._id} indexed successfully.`);
    } catch (e) {
        logError('FAISS', `Failed to auto-embed job ${job._id}`, e);
    }
}
