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
exports.updateStatus = exports.getAllApplications = exports.getMyApplications = exports.apply = void 0;
const AppService = __importStar(require("../services/application.service"));
const application_service_1 = require("../services/application.service");
const apply = async (req, res, next) => {
    try {
        const data = application_service_1.applySchema.parse(req.body);
        const application = await AppService.applyToJob(data, req.user.id);
        res.status(201).json({ success: true, data: application });
    }
    catch (err) {
        next(err);
    }
};
exports.apply = apply;
const getMyApplications = async (req, res, next) => {
    try {
        const applications = await AppService.getMyApplications(req.user.id);
        res.json({ success: true, data: applications });
    }
    catch (err) {
        next(err);
    }
};
exports.getMyApplications = getMyApplications;
const getAllApplications = async (req, res, next) => {
    try {
        const { jobId } = req.query;
        const applications = await AppService.getAllApplications(jobId);
        res.json({ success: true, data: applications });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllApplications = getAllApplications;
const updateStatus = async (req, res, next) => {
    try {
        const data = application_service_1.updateStatusSchema.parse(req.body);
        const application = await AppService.updateApplicationStatus(req.params.id, data);
        res.json({ success: true, data: application });
    }
    catch (err) {
        next(err);
    }
};
exports.updateStatus = updateStatus;
//# sourceMappingURL=application.controller.js.map