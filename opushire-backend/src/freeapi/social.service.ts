import { freeApiClient } from './freeapi.client';
import { FreeApiAuthService } from './auth.service';
import { Job } from '../models/Job';

export class FreeApiSocialService {
    /**
     * Helper to get a single generic "System" token used to create
     * the root Posts for Jobs if they don't exist yet.
     */
    private static async getSystemToken(): Promise<string> {
        return await FreeApiAuthService.getOrGenerateToken('system@opushire.com', 'OpusHireSystem');
    }

    /**
     * Ensures that a FreeAPI Post exists for a given Job.
     * Returns the FreeAPI postId.
     */
    public static async getOrGeneratePostForJob(jobId: string): Promise<string> {
        const job = await Job.findById(jobId);
        if (!job) throw new Error('Job not found in OpusHire database');

        if (job.freeApiPostId) {
            return job.freeApiPostId;
        }

        // Job doesn't have a linked FreeAPI post yet. Let's create one using the system account.
        const systemToken = await this.getSystemToken();

        const content = `Job Posting: ${job.title} at ${job.company}\nLocation: ${job.location || job.city}\nLink: /jobs/${job._id}`;

        const formData = new FormData();
        formData.append('content', content);
        // Note: FreeAPI's multi-part post creation requires content as a field

        const res = await freeApiClient.post('/social-media/posts', formData, {
            headers: {
                Authorization: `Bearer ${systemToken}`,
            },
        });

        const postId = res.data.data._id;

        // Save it back to our local DB
        job.freeApiPostId = postId;
        await job.save();

        return postId;
    }

    /**
     * Toggles the "Like" (which we treat as "Save Job" or "Bookmark") status
     * for a user on a given Job.
     */
    public static async toggleSaveJob(userToken: string, jobId: string): Promise<{ isLiked: boolean }> {
        const postId = await this.getOrGeneratePostForJob(jobId);

        const res = await freeApiClient.post(`/social-media/likes/post/${postId}`, {}, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        return { isLiked: res.data.data.isLiked };
    }
}
