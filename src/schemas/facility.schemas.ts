import { z } from "../docs/zod-openapi.js";

export const idSchema = z.object({
    params: z.object({
        id: z.uuid(),
    })
});