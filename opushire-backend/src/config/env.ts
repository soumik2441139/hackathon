import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 chars'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // AI / LLM
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
    GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

    // Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
    AZURE_STORAGE_ACCOUNT: z.string().optional(),
    AZURE_STORAGE_KEY: z.string().optional(),

    // SMTP / Email verification
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().default('false'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // Redis (BullMQ)
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS: z.string().default('false'),

    // Misc
    LOG_LEVEL: z.string().default('info'),
    AUTO_APPLY_SUBMIT: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
