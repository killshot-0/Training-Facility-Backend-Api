import { z } from 'zod';


export const envSchema = z.object({
    NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGIN: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),

    GOOGLE_ISSUER: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.url(),

    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().min(1)
});