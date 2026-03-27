import { createWorker } from '../queue.service';
import { env } from '../../../config/env';
import { sendAutoMatchEmail } from '../../email.service';

export function registerEmailWorker() {
  createWorker('email-notifications', async (data: any) => {
    const jobUrl = `${env.FRONTEND_URL}/dashboard/student/jobs/${data.jobId}`;
    await sendAutoMatchEmail({
      email: data.email,
      name: data.name,
      jobTitle: data.jobTitle,
      company: data.company,
      matchScore: data.matchScore,
      jobUrl: jobUrl
    });
    return { deliveredTo: data.email };
  });
}
