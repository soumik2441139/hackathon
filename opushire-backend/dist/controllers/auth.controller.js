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
exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const AuthService = __importStar(require("../services/auth.service"));
const auth_service_1 = require("../services/auth.service");
const register = async (req, res, next) => {
    try {
        const data = auth_service_1.registerSchema.parse(req.body);
        const result = await AuthService.registerUser(data);
        res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const data = auth_service_1.loginSchema.parse(req.body);
        const result = await AuthService.loginUser(data);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const user = await AuthService.getProfile(req.user.id);
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res, next) => {
    try {
        const user = await AuthService.updateProfile(req.user.id, req.body);
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=auth.controller.js.map