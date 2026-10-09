import { z } from "zod";

export const userRequestSchema = z.object({
    body: z.object({
        subject: z.string().trim().min(3).max(160), 
        message: z.string().trim().min(3).max(2000)
    })
});

export const aiResponseSchema = z.object({
    category: z.enum(["facilities", "plans", "memberships", "pricing", "subscriptions", "other"]),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    summary: z.string().min(1).max(240),
    draftReply: z.string().min(1).max(1200),
    needsHumanReview: z.boolean(),
});

export type UserRequestInput = z.infer<typeof userRequestSchema>["body"];
export type AiResponseInput = z.infer<typeof aiResponseSchema>;