import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const avatarFileSchema = z.object({
    file: z.object({
        size: z.number().max(MAX_FILE_SIZE, "File size must be less than 5 MBs!"),
        mimetype: z.enum(ALLOWED_IMAGE_TYPES)
    })
}); 


export type AvatarFileInput = z.infer<typeof avatarFileSchema>["file"]; 