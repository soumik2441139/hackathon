import Job from '../../models/Job';
import { embedText } from '../ai/embedding.service';
import { addVector } from './faiss.store';
import { normalizeSkills } from '../../utils/skillNormalizer';

export async function indexAllJobs(): Promise<void> {
    try {
        console.log("Starting bulk job vectorization...");
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
        
        console.log(`✅ ${count} Jobs successfully indexed into FAISS`);
    } catch (e) {
        console.error("Bulk indexing failed:", e);
    }
}
