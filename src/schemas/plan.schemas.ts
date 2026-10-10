import { z } from 'zod';
import { MembershipTypes } from '../generated/prisma/enums.js';

export const idSchema = z.object({
    params: z.object({
        id: z.uuid(),
    })
});

export const planQuerySchema = z.object({
    query: z.object({
        membership: z.enum(MembershipTypes).optional()
    })
});

export const priceChangeSchema = z.object({
    params: idSchema.shape.params,
    body: z.object({
        membership: z.enum(MembershipTypes),
        price: z.coerce.number().nonnegative()
    })
});


export type PlanQueryInput = z.infer<typeof planQuerySchema>["query"];
export type PriceChangeInput = z.infer<typeof priceChangeSchema>["body"];