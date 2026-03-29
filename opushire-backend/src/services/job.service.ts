import { z } from 'zod';
import { JobRepo } from '../repositories/job.repository';
import { Student } from '../models/Student';
import { Admin } from '../models/Admin';
import { Application } from '../models/Application';
import { createError } from '../middleware/errorHandler';
import { imageToBase64 } from './image.service';

export const createJobSchema = z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    companyLogo: z.string().optional().default('🏢'),
    location: z.string().optional().default(''),
    city: z.string().optional().default(''),
    type: z.enum(['Internship', 'Full-time', 'Part-time', 'Contract']),
    mode: z.enum(['Remote', 'Hybrid', 'Onsite']),
    salaryMin: z.number().optional().default(0),
    salaryMax: z.number().optional().default(0),
    salary: z.string().optional().default(''),
    description: z.string().min(1),
    responsibilities: z.array(z.string()).optional().default([]),
    requirements: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    openings: z.number().optional().default(1),
    deadline: z.string().optional(),
    featured: z.boolean().optional().default(false),
    companyWebsite: z.string().optional(),
});

// Allowlist for updates — prevents overwriting postedBy, _id, etc.
export const updateJobSchema = createJobSchema.partial();

export const jobFilterSchema = z.object({
    q: z.string().optional(),
    type: z.string().optional(),
    mode: z.string().optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    source: z.string().optional(),
    featured: z.string().optional(),
    postedBy: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('12'),
});

export const getJobs = async (filters: z.infer<typeof jobFilterSchema>) => {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '12');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
        isArchived: { $ne: true }
    };

    if (filters.q) {
        query.$text = { $search: filters.q };
    }
    if (filters.type) query.type = filters.type;
    if (filters.mode) query.mode = filters.mode;
    if (filters.city) query.city = new RegExp(filters.city, 'i');
    if (filters.location) query.location = new RegExp(filters.location, 'i');
    if (filters.source) query.source = filters.source;
    if (filters.featured === 'true') query.featured = true;
    if (filters.postedBy) query.postedBy = filters.postedBy;

    const { jobs, total } = await JobRepo.findJobsWithCount(query, skip, limit);

    return {
        jobs,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
};

export const getJobById = async (id: string) => {
    const job = await JobRepo.findById(id);
    if (!job) throw createError('Job not found', 404);
    return job;
};

export const createJob = async (data: z.infer<typeof createJobSchema>, userId: string) => {
    let logo = data.companyLogo;
    if (logo && logo.startsWith('http')) {
        logo = await imageToBase64(logo);
    }

    const job = await JobRepo.create({
        ...data,
        companyLogo: logo,
        posted: 'Just now',
        postedBy: userId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    return job;
};

export const updateJob = async (id: string, rawData: unknown) => {
    const data = updateJobSchema.parse(rawData);

    if (data.companyLogo && data.companyLogo.startsWith('http')) {
        data.companyLogo = await imageToBase64(data.companyLogo);
    }

    const job = await JobRepo.updateById(id, data);
    if (!job) throw createError('Job not found', 404);
    return job;
};

export const deleteJob = async (id: string) => {
    const job = await JobRepo.deleteById(id);
    if (!job) throw createError('Job not found', 404);
    return { message: 'Job deleted' };
};

export const deleteJobs = async (ids: string[]) => {
    const result = await JobRepo.deleteMany(ids);
    return { message: `${result.deletedCount} jobs deleted`, count: result.deletedCount };
};

