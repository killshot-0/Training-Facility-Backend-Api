import { z } from 'zod';


export const envSchema = z.object({
    NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGIN: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),

    COOKIE_SECRET: z.string().min(32),

    GOOGLE_ISSUER: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.url(),

    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().min(1),

    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),

    RESEND_API_KEY: z.string().startsWith("re_"),
    EMAIL_FROM: z.email().or(
        z.string().regex(/^.+\s<[^<>]+@[^<>]+>$/)
    ),

    OPENROUTER_API_KEY: z.string().startsWith("sk-or-v1-"),
    OPENROUTER_MODEL: z.string().min(1)
});