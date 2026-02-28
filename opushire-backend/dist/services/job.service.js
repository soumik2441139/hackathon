"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = exports.jobFilterSchema = exports.updateJobSchema = exports.createJobSchema = void 0;
const zod_1 = require("zod");
const Job_1 = require("../models/Job");
const errorHandler_1 = require("../middleware/errorHandler");
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    company: zod_1.z.string().min(2),
    companyLogo: zod_1.z.string().optional().default('🏢'),
    location: zod_1.z.string().optional().default(''),
    city: zod_1.z.string().optional().default(''),
    type: zod_1.z.enum(['Internship', 'Full-time', 'Part-time', 'Contract']),
    mode: zod_1.z.enum(['Remote', 'Hybrid', 'Onsite']),
    salaryMin: zod_1.z.number().optional().default(0),
    salaryMax: zod_1.z.number().optional().default(0),
    salary: zod_1.z.string().optional().default(''),
    description: zod_1.z.string().min(20),
    responsibilities: zod_1.z.array(zod_1.z.string()).optional().default([]),
    requirements: zod_1.z.array(zod_1.z.string()).optional().default([]),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    openings: zod_1.z.number().optional().default(1),
    deadline: zod_1.z.string().datetime().optional(),
    featured: zod_1.z.boolean().optional().default(false),
});
// Allowlist for updates — prevents overwriting postedBy, _id, etc.
exports.updateJobSchema = exports.createJobSchema.partial();
exports.jobFilterSchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    mode: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    featured: zod_1.z.string().optional(),
    page: zod_1.z.string().optional().default('1'),
    limit: zod_1.z.string().optional().default('12'),
});
const getJobs = async (filters) => {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '12');
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.q) {
        query.$text = { $search: filters.q };
    }
    if (filters.type)
        query.type = filters.type;
    if (filters.mode)
        query.mode = filters.mode;
    if (filters.city)
        query.city = new RegExp(filters.city, 'i');
    if (filters.featured === 'true')
        query.featured = true;
    const [jobs, total] = await Promise.all([
        Job_1.Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('postedBy', 'name email'),
        Job_1.Job.countDocuments(query),
    ]);
    return {
        jobs,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
};
exports.getJobs = getJobs;
const getJobById = async (id) => {
    const job = await Job_1.Job.findById(id).populate('postedBy', 'name email');
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    return job;
};
exports.getJobById = getJobById;
const createJob = async (data, adminId) => {
    const job = await Job_1.Job.create({
        ...data,
        posted: 'Just now',
        postedBy: adminId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    return job;
};
exports.createJob = createJob;
const updateJob = async (id, rawData) => {
    const data = exports.updateJobSchema.parse(rawData);
    const job = await Job_1.Job.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    return job;
};
exports.updateJob = updateJob;
const deleteJob = async (id) => {
    const job = await Job_1.Job.findByIdAndDelete(id);
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    return { message: 'Job deleted' };
};
exports.deleteJob = deleteJob;
//# sourceMappingURL=job.service.js.map