import { email, z } from 'zod';

export const passwordSchema =z.string().trim().min(12, "minimum 12 characters").max(123, "maximum 128 character");

export const emailSchema = z.email("Enter an email address!").trim().max(256).transform((e) => e.toLowerCase());

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Enter name"),
        email: emailSchema,
        password: passwordSchema
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: passwordSchema
    })
});

export type PasswordInput = z.infer<typeof passwordSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];