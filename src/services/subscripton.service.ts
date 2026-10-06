import { prisma } from "../lib/prisma.js";
import { SubscriptionQueryInput1, SubscriptionCreateInput1, SubscriptionChangeInput } from "../schemas/subscription.schemas.js";

export function findSubscription(id?:string, query?: SubscriptionQueryInput1){
    if(id){
        return prisma.subscription.findUnique({
            where:{id}
        });
    }
    return prisma.subscription.findMany({
        where: {
            ...(query?.userId !== undefined && {
                user: {
                    id: query.userId
                }
            }),
            ...(query?.plan !== undefined && {
                plan: {
                    name: query.plan
                }
            }),
            ...(query?.membership !== undefined && {
                membership: query.membership
            }),
            ...(query?.status !== undefined && {
                status: query.status
            })
        }
    });
};

export function findUsersWithSubscriptions(){
    return prisma.user.findMany({
        where: {
            subscriptions: {
                some: {}
            }
        },
        include: {
            subscriptions: true
        }
    });
};

export async function postSubscription(body: SubscriptionCreateInput1){
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch(body.membership) {
        case "MONTHLY":
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case "QUARTERLY":
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case "HALF_YEARLY":
            endDate.setMonth(endDate.getMonth() + 6);
            break;
        case "YEARLY":
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
    };

    return prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.create({
            data: {
                user: {
                    connect: {
                        id: body.userId
                    }
                },
                plan: {
                    connect: {
                        name: body.plan
                    }
                },
                membership: body.membership,
                startDate,
                endDate,
                status: "ACTIVE"
            }
        });
        const amount = await tx.planPrice.findUniqueOrThrow({
            where: {
                planId_membership: {
                    planId: subscription.planId,
                    membership: subscription.membership
                }
            }
        });

        const payment = await tx.payment.create({
            data: {
                userId: body.userId,
                subscriptionId: subscription.id,
                amount: amount.price,

            }
        });
        return {subscription, payment};
    });
};

export async function patchSubscriptionStatus(id: string, body: SubscriptionChangeInput){
    const getSubscription = await prisma.subscription.findUnique({
        where: {id}
    }); 
    if(getSubscription!.status === body.status || getSubscription!.status === "EXPIRED"){
        return null;
    }

    const subscription = await prisma.subscription.update({
        where: {id},
        data: {
            status: body.status
        }
    })
};

export function removeSubscription(id: string){
    return prisma.subscription.delete({
        where: {id}
    });
};