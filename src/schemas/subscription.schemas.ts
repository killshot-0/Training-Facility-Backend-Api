import { z } from "../docs/zod-openapi.js";
import { SubscriptionStatus } from '../generated/prisma/enums.js';
import { subscriptionQuerySchema, subscriptionCreateSchema } from './user.schemas.js';
import { idSchema } from './facility.schemas.js';

export const subscriptionQuery1Schema = subscriptionQuerySchema.extend({
    query: subscriptionQuerySchema.shape.query.extend({
        userId: z.uuid().optional()
    })
});

export const subscriptionCreate1Schema = subscriptionCreateSchema.extend({
    body: subscriptionCreateSchema.shape.body.extend({
        userId: z.uuid()
    })
});

export const subscriptionChangeSchema = z.object({
    params: idSchema.shape.params,
    body: z.object({
        status: z.enum(SubscriptionStatus)
    })
});

export type SubscriptionQueryInput1 = z.infer<typeof subscriptionQuery1Schema>["query"];
export type SubscriptionCreateInput1 = z.infer<typeof subscriptionCreate1Schema>["body"];
export type SubscriptionChangeInput = z.infer<typeof subscriptionChangeSchema>["body"];

export {idSchema}