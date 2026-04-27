import Job from '../../models/Job';
import { embedText } from '../ai/embedding.service';
import { addVector } from './faiss.store';
import { normalizeSkills } from '../../utils/skillNormalizer';
import { log, logError } from '../../utils/logger';

export async function indexAllJobs(): Promise<void> {
    try {
        log('JOB_VECTORIZER', 'Starting bulk job vectorization...');
        const jobs = await Job.find({});
        
        let count = 0;
        for (const job of jobs) {
            const skills = await normalizeSkills(job.skills || []);
            
            const text = `
    Job Title: ${job.title}
    Description: ${job.description}
    Required Skills: ${skills.join(", ")}
    Experience Level: ${job.level}
    Industry Domains: ${job.domains?.join(", ") || ''}
  `;
            
            const vec = await embedText(text);
            addVector(job._id.toString(), vec);
            count++;
        }
        
        log('JOB_VECTORIZER', `${count} Jobs successfully indexed into FAISS`);
    } catch (e) {
        logError('JOB_VECTORIZER', 'Bulk indexing failed', e);
    }
}
