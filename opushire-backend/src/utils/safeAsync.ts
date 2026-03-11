import { Request, Response, NextFunction } from "express";
import { logError } from "./logger";

// Standard Async Handler for standalone background processes
export const safeAsync = (fn: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
  try { 
    return await fn(...args); 
  } catch (error) { 
    logError("SAFE_ASYNC", `Unhandled background promise rejection`, error);
  }
};

// Express Middleware Async Handler (catches & passes safely to global error handler)
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
