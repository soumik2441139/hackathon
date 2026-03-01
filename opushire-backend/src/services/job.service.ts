import { z } from 'zod';
import { Job } from '../models/Job';
import { createError } from '../middleware/errorHandler';

export const createJobSchema = z.object({
    title: z.string().min(3),
    company: z.string().min(2),
    companyLogo: z.string().optional().default('🏢'),
    location: z.string().optional().default(''),
    city: z.string().optional().default(''),
    type: z.enum(['Internship', 'Full-time', 'Part-time', 'Contract']),
    mode: z.enum(['Remote', 'Hybrid', 'Onsite']),
    salaryMin: z.number().optional().default(0),
    salaryMax: z.number().optional().default(0),
    salary: z.string().optional().default(''),
    description: z.string().min(20),
    responsibilities: z.array(z.string()).optional().default([]),
    requirements: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    openings: z.number().optional().default(1),
    deadline: z.string().datetime().optional(),
    featured: z.boolean().optional().default(false),
});

// Allowlist for updates — prevents overwriting postedBy, _id, etc.
export const updateJobSchema = createJobSchema.partial();

export const jobFilterSchema = z.object({
    q: z.string().optional(),
    type: z.string().optional(),
    mode: z.string().optional(),
    city: z.string().optional(),
    featured: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('12'),
});

export const getJobs = async (filters: z.infer<typeof jobFilterSchema>) => {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '12');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filters.q) {
        query.$text = { $search: filters.q };
    }
    if (filters.type) query.type = filters.type;
    if (filters.mode) query.mode = filters.mode;
    if (filters.city) query.city = new RegExp(filters.city, 'i');
    if (filters.featured === 'true') query.featured = true;

    const [jobs, total] = await Promise.all([
        Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('postedBy', 'name email'),
        Job.countDocuments(query),
    ]);

    return {
        jobs,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
};

export const getJobById = async (id: string) => {
    const job = await Job.findById(id).populate('postedBy', 'name email');
    if (!job) throw createError('Job not found', 404);
    return job;
};

export const createJob = async (data: z.infer<typeof createJobSchema>, userId: string) => {
    const job = await Job.create({
        ...data,
        posted: 'Just now',
        postedBy: userId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    return job;
};

export const updateJob = async (id: string, rawData: unknown) => {
    const data = updateJobSchema.parse(rawData);
    const job = await Job.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!job) throw createError('Job not found', 404);
    return job;
};

export const deleteJob = async (id: string) => {
    const job = await Job.findByIdAndDelete(id);
    if (!job) throw createError('Job not found', 404);
    return { message: 'Job deleted' };
};
