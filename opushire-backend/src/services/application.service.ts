import { z } from 'zod';
import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { createError } from '../middleware/errorHandler';

export const applySchema = z.object({
    jobId: z.string().min(1, 'Job ID is required'),
    coverLetter: z.string().optional(),
    phone: z.string().optional(),
    linkedin: z.string().url().optional().or(z.literal('')),
});

export const updateStatusSchema = z.object({
    status: z.enum(['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Hired']),
});

export const applyToJob = async (data: z.infer<typeof applySchema>, applicantId: string) => {
    const job = await Job.findById(data.jobId);
    if (!job) throw createError('Job not found', 404);

    const existing = await Application.findOne({ job: data.jobId, applicant: applicantId });
    if (existing) throw createError('You have already applied to this job', 409);

    const application = await Application.create({
        job: data.jobId,
        applicant: applicantId,
        coverLetter: data.coverLetter,
        phone: data.phone,
        linkedin: data.linkedin,
    });

    return application.populate(['job', 'applicant']);
};

export const getMyApplications = async (userId: string) => {
    return Application.find({ applicant: userId })
        .populate('job', 'title company companyLogo location type mode salary tags')
        .sort({ appliedAt: -1 });
};

export const getAllApplications = async (jobId?: string) => {
    const query = jobId ? { job: jobId } : {};
    return Application.find(query)
        .populate('job', 'title company')
        .populate('applicant', 'name email college degree year')
        .sort({ appliedAt: -1 });
};

export const updateApplicationStatus = async (
    applicationId: string,
    data: z.infer<typeof updateStatusSchema>
) => {
    const app = await Application.findByIdAndUpdate(
        applicationId,
        { status: data.status },
        { new: true }
    ).populate(['job', 'applicant']);

    if (!app) throw createError('Application not found', 404);
    return app;
};
