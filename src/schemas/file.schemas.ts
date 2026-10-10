import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const avatarFileSchema = z.object({
    file: z.object({
        size: z.number().max(MAX_FILE_SIZE, "File size must be less than 5 MBs!"),
        mimetype: z.enum(ALLOWED_IMAGE_TYPES)
    })
}); 

export const paymentFileSchema = z.object({
    params: z.object({
        id: z.uuid(),
    }),
    file: z.object({
        siz: z.number().max(MAX_FILE_SIZE, "File size must be less than 5 MBs!"),
        mime: z.enum(ALLOWED_IMAGE_TYPES)
    })
});

export type AvatarFileInput = z.infer<typeof avatarFileSchema>["file"]; 
export type PaymentFileInput = z.infer<typeof paymentFileSchema>["file"];