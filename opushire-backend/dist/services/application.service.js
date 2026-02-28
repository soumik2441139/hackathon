"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getAllApplications = exports.getMyApplications = exports.applyToJob = exports.updateStatusSchema = exports.applySchema = void 0;
const zod_1 = require("zod");
const Application_1 = require("../models/Application");
const Job_1 = require("../models/Job");
const errorHandler_1 = require("../middleware/errorHandler");
exports.applySchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1, 'Job ID is required'),
    coverLetter: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    linkedin: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Hired']),
});
const applyToJob = async (data, applicantId) => {
    const job = await Job_1.Job.findById(data.jobId);
    if (!job)
        throw (0, errorHandler_1.createError)('Job not found', 404);
    const existing = await Application_1.Application.findOne({ job: data.jobId, applicant: applicantId });
    if (existing)
        throw (0, errorHandler_1.createError)('You have already applied to this job', 409);
    const application = await Application_1.Application.create({
        job: data.jobId,
        applicant: applicantId,
        coverLetter: data.coverLetter,
        phone: data.phone,
        linkedin: data.linkedin,
    });
    return application.populate(['job', 'applicant']);
};
exports.applyToJob = applyToJob;
const getMyApplications = async (userId) => {
    return Application_1.Application.find({ applicant: userId })
        .populate('job', 'title company companyLogo location type mode salary tags')
        .sort({ appliedAt: -1 });
};
exports.getMyApplications = getMyApplications;
const getAllApplications = async (jobId) => {
    const query = jobId ? { job: jobId } : {};
    return Application_1.Application.find(query)
        .populate('job', 'title company')
        .populate('applicant', 'name email college degree year')
        .sort({ appliedAt: -1 });
};
exports.getAllApplications = getAllApplications;
const updateApplicationStatus = async (applicationId, data) => {
    const app = await Application_1.Application.findByIdAndUpdate(applicationId, { status: data.status }, { new: true }).populate(['job', 'applicant']);
    if (!app)
        throw (0, errorHandler_1.createError)('Application not found', 404);
    return app;
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=application.service.js.map