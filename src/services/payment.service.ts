import { prisma } from "../lib/prisma.js";
import { PaymentQueryInput1, PaymentChangeInput } from "../schemas/payment.schemas.js";

export function findPayment(id?: string, query?: PaymentQueryInput1){
    if(id){
        return prisma.payment.findUnique({
            where: {id}
        });
    }

    return prisma.payment.findMany({
        where: {
            ...(query?.userId !== undefined && {
                userId: query.userId
            }),
            ...(query?.plan !== undefined && {
                subscription: {
                    plan: {
                        name: query.plan
                    }
                }
            }),
            ...(query?.status !== undefined && {
                status: query.status
            }),
            ...((query?.maxAmount !== undefined || query?.minAmount !== undefined) && {
                amount: {
                    ...(query.minAmount !== undefined && {
                            gte: query.minAmount
                    }),
                    ...(query.maxAmount !== undefined && {
                            lte: query.maxAmount
                    })
                }
            })
        }
    });
};

export async function patchPayment(id: string, body: PaymentChangeInput){
    const getPayment = await prisma.payment.findUnique({
        where: {id}
    });

    if(getPayment?.status === body.status || getPayment?.status !== "PENDING"){
        return null;
    }
    return prisma.payment.update({
        where: {id},
        data: {
            status: body.status
        }
    });
};

export function removePayment(id:string){
    return prisma.payment.delete({
        where: {id}
    });
};