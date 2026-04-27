import { embedText } from '../ai/embedding.service';
import { search } from './faiss.store';
import Job, { IJob } from '../../models/Job';
import { logError } from '../../utils/logger';

export async function findSimilar(text: string, limit: number = 20): Promise<IJob[]> {
    try {
        const vec = await embedText(text);
        const ids = search(vec, limit);
        
        if (ids.length === 0) return [];

        // Retrieve matched jobs from DB
        const jobs = await Job.find({ _id: { $in: ids } });
        
        // Mongo returns out-of-order, re-sort to map the strict similarity order returned by FAISS
        const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));
        const sortedJobs = ids.map(id => jobMap.get(id)).filter(j => j !== undefined) as IJob[];
        
        return sortedJobs;
    } catch (e) {
        logError('VECTOR_SEARCH', 'Similarity search failed', e);
        return [];
    }
}
