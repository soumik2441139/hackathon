import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError | ZodError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Handle Zod validation errors thrown from schema.parse() in controllers/services
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.flatten().fieldErrors,
        });
        return;
    }

    const statusCode = (err as AppError).statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (env.NODE_ENV === 'development') {
        console.error(`❌ Error [${statusCode}]: ${message}`, err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export const createError = (message: string, statusCode: number): AppError => {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
