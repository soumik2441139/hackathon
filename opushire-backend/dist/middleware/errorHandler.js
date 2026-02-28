"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const errorHandler = (err, _req, res, _next) => {
    // Handle Zod validation errors thrown from schema.parse() in controllers/services
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.flatten().fieldErrors,
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    if (env_1.env.NODE_ENV === 'development') {
        console.error(`❌ Error [${statusCode}]: ${message}`, err.stack);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map