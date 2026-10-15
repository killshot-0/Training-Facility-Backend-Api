import { z } from "../docs/zod-openapi.js";
import { paymentQuerySchema } from './user.schemas.js';
import { PaymentStatus } from '../generated/prisma/enums.js';
import { idSchema } from './facility.schemas.js';


export const paymentQuery1Schema = paymentQuerySchema.extend({
    query: paymentQuerySchema.shape.query.extend({
        userId: z.uuid().optional()
    })
});

export const paymentChangeSchema = z.object({
    params: idSchema.shape.params,
    body: z.object({
        status: z.enum(PaymentStatus)
    })
});


export type PaymentQueryInput1 = z.infer<typeof paymentQuery1Schema>["query"];
export type PaymentChangeInput = z.infer<typeof paymentChangeSchema>["body"];

export {idSchema}