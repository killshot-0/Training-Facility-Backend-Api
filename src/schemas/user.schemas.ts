import { email, z } from 'zod';
import { MembershipTypes, SubscriptionStatus, PlanTypes, PaymentStatus, FacilityTypes} from '../generated/prisma/enums.js';

export const idSchema = z.object({
    params: z.object({
        id: z.uuid().optional(),
    })
});
export const dataChangeSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).max(256).optional(),
        email: z.email().trim().max(256).transform((e) => e.toLowerCase()).optional(),
        password: z.string().trim().min(12, "minimum 12 characters").max(128, "maximum 128 characters").optional()
    })
});

export const subscriptionQuerySchema = z.object({
    query: z.object({
        membership: z.enum(MembershipTypes).optional(),
        status: z.enum(SubscriptionStatus).optional(),
        plan: z.enum(PlanTypes).optional()
    })
});

export const subscriptionCreateSchema = z.object({
    body: z.object({
        plan: z.enum(PlanTypes),
        membership: z.enum(MembershipTypes)
    })
});

export const paymentQuerySchema = z.object({
    query: z.object({
        plan: z.enum(PlanTypes).optional(),
        status: z.enum(PaymentStatus).optional(),
        minAmount: z.coerce.number().nonnegative().optional(),
        maxAmount: z.coerce.number().nonnegative().optional()
    })
});

export const sessionQuerySchema = z.object({
    query: z.object({
        facility: z.enum(FacilityTypes).optional(),
        checkIn: z.coerce.date().optional(),
        checkOut: z.coerce.date().optional()
    })
});

export const sessionCreateSchema = z.object({
    body: z.object({
        facility: z.enum(FacilityTypes)
    })
});


export type DataChangeInput = z.infer<typeof dataChangeSchema>["body"];
export type SubscriptionQueryInput = z.infer<typeof subscriptionQuerySchema>["query"];
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>["body"];
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>["query"];
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>["query"];
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>["body"];