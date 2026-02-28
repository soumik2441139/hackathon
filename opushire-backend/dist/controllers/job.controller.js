"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const JobService = __importStar(require("../services/job.service"));
const job_service_1 = require("../services/job.service");
const getJobs = async (req, res, next) => {
    try {
        const filters = job_service_1.jobFilterSchema.parse(req.query);
        const result = await JobService.getJobs(filters);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res, next) => {
    try {
        const job = await JobService.getJobById(req.params.id);
        res.json({ success: true, data: job });
    }
    catch (err) {
        next(err);
    }
};
exports.getJobById = getJobById;
const createJob = async (req, res, next) => {
    try {
        const data = job_service_1.createJobSchema.parse(req.body);
        const job = await JobService.createJob(data, req.user.id);
        res.status(201).json({ success: true, data: job });
    }
    catch (err) {
        next(err);
    }
};
exports.createJob = createJob;
const updateJob = async (req, res, next) => {
    try {
        const job = await JobService.updateJob(req.params.id, req.body);
        res.json({ success: true, data: job });
    }
    catch (err) {
        next(err);
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res, next) => {
    try {
        const result = await JobService.deleteJob(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteJob = deleteJob;
//# sourceMappingURL=job.controller.js.map