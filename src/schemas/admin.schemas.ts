import { z } from "../docs/zod-openapi.js";
import { RoleName, PlanTypes, FacilityTypes } from '../generated/prisma/enums.js';
import * as planSchema from '../schemas/plan.schemas.js';
import * as subscriptionSchema from '../schemas/subscription.schemas.js';
import * as paymentSchema from '../schemas/payment.schemas.js';
import * as sessionSchema from '../schemas/session.schemas.js';
import { idSchema } from './facility.schemas.js';


export const roleChangeSchema = z.object({
    params: idSchema.shape.params,
    body: z.object({
        role: z.enum(RoleName)
    })
});

export const planCreateSchema = z.object({
    body: z.object({
        plan: z.enum(PlanTypes)
    })
});

export const facilityCreateSchema = z.object({
    body: z.object({
        facility: z.enum(FacilityTypes)
    })
});

export const getByRoleSchema = z.object({
    body: z.object({
        role: z.enum(RoleName)
    })
});



export type RoleChangeInput = z.infer<typeof roleChangeSchema>["body"];
export type PlanCreateInput = z.infer<typeof planCreateSchema>["body"];
export type FacilityCreateInput = z.infer<typeof facilityCreateSchema>["body"];
export type GetByRoleInput = z.infer<typeof getByRoleSchema>["body"];

export {
    idSchema,
    planSchema,
    subscriptionSchema,
    paymentSchema,
    sessionSchema
};