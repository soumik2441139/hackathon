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
exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const JobSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    companyLogo: { type: String, default: '🏢' },
    location: { type: String, trim: true },
    city: { type: String, trim: true },
    type: {
        type: String,
        enum: ['Internship', 'Full-time', 'Part-time', 'Contract'],
        required: true,
    },
    mode: {
        type: String,
        enum: ['Remote', 'Hybrid', 'Onsite'],
        required: true,
    },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    salary: { type: String, trim: true },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    tags: [{ type: String, trim: true }],
    openings: { type: Number, default: 1 },
    deadline: { type: Date },
    featured: { type: Boolean, default: false },
    posted: { type: String },
    postedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
// Full-text search index
JobSchema.index({ title: 'text', company: 'text', tags: 'text' });
// Filter indexes
JobSchema.index({ type: 1 });
JobSchema.index({ mode: 1 });
JobSchema.index({ city: 1 });
JobSchema.index({ featured: 1 });
JobSchema.index({ createdAt: -1 });
exports.Job = mongoose_1.default.model('Job', JobSchema);
//# sourceMappingURL=Job.js.map