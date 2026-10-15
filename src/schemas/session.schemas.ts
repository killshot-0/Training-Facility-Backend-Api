import { z } from "../docs/zod-openapi.js";
import { sessionQuerySchema, sessionCreateSchema } from './user.schemas.js';
import { idSchema } from './facility.schemas.js';


export const sessionQuery1Schema = sessionQuerySchema.extend({
    query: sessionQuerySchema.shape.query.extend({
        userId: z.uuid().optional()
    })
});

export const sessionCreate1Schema = sessionCreateSchema.extend({
    body: sessionCreateSchema.shape.body.extend({
        userId: z.uuid()
    })
});

export type SessionQueryInput1 = z.infer<typeof sessionQuery1Schema>["query"];
export type SessionCreateInput1 = z.infer<typeof sessionCreate1Schema>["body"];

export {idSchema}