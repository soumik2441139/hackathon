import { findSimilar } from '../vector/similarity.search';
import { rerank } from '../ranking/rerank.service';
import { explainMatch } from '../ai/job.matcher';
import { IParsedData, IResumeMatch } from '../../models/Resume';
import { logError } from '../../utils/logger';

export async function getMatches(resumeText: string, candidate: IParsedData): Promise<IResumeMatch[]> {
    // 1. Broad Vector Search (Top 20 from FAISS)
    const similarJobs = await findSimilar(resumeText, 20);
    
    if (!similarJobs || similarJobs.length === 0) return [];

    // 2. Precision Re-Ranking
    const rankedJobs = rerank(similarJobs, candidate);

    // 3. Keep Top 5 and Explain via LLM
    const topMatches = rankedJobs.slice(0, 5);
    const finalMatches: IResumeMatch[] = [];

    for (const r of topMatches) {
        // In a strictly typed mongoose Model, we extract the raw ObjectId string
        const jobId = r.job._id as any; 
        
        try {
            const explanationJsonStr = await explainMatch(candidate, r.job);
            // Even though we generate JSON, we store it as a string explanation based on schema requirement, or parse it depending on needs.
            // The schema requires "explanation: String". We will save the raw JSON string which the frontend can parse.
            
            finalMatches.push({
                job: jobId,
                rerankScore: r.score,
                explanation: explanationJsonStr
            });
        } catch (e) {
            logError('MATCH', `Failed to explain match for job ${jobId}`, e);
            // Fallback
            finalMatches.push({
                job: jobId,
                rerankScore: r.score,
                explanation: JSON.stringify({ match_score: 0, reason: "Analysis temporarily unavailable." })
            });
        }
    }

    return finalMatches;
}
