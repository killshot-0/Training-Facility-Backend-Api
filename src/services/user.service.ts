import { stat } from "node:fs";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/storage.js";
import { env } from "../config/env.js";
import path from "path";
import crypto from "crypto";
import { 
    DataChangeInput, 
    SubscriptionQueryInput, 
    SubscriptionCreateInput, 
    PaymentQueryInput, 
    SessionQueryInput, 
    SessionCreateInput
} from "../schemas/user.schemas.js";
import { hashPassword } from "../utils/password.js";
import { en } from "zod/locales";

export const safeUserSelect = {
  id: true,
  email: true,
  role: {
    select:{
        name: true
    }
  },
  createdAt: true,
  avatarUrl: true
} satisfies Prisma.UserSelect;

export function findUser(id: string){
    return prisma.user.findUnique({ 
        where: { id },
        select: safeUserSelect 
    });
};

export async function infoPatch(id: string, data: DataChangeInput){
    return prisma.user.update({
        where: {id},
        data: {
            ...(data.name && {
                name: data.name
            }),
            ...(data.email && {
                email: data.email
            }),
            ...(data.password && {
                passwordHash: await hashPassword(data.password)
            }),
        },
        select: safeUserSelect
    });
};

export async function addAvatar(userId: string, file: Express.Multer.File){
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {avatarPath: true}
    });

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const uniqueFileName = `avatars/${crypto.randomUUID()}${fileExtension}`;

    const {data, error} = await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(uniqueFileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
    if(error){
        throw new Error(`Cloud Storage Failed: ${error.message}`);
    }

    const {data: publicUrlData} = supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(data.path);

    const updatedUser = prisma.user.update({
        where: {id: userId},
        data: {
            avatarUrl: publicUrlData.publicUrl,
            avatarPath: data.path
        },
        select: safeUserSelect
    });

    if(user?.avatarPath){
        const {error} = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([user.avatarPath]);
        if(error){
            console.error(`Failed to remove asset from bucket: ${error.message}`);
        }
    }

    return updatedUser;
};

export async function removeAvatar(userId: string){
    const filePath = await prisma.user.findUnique({
        where: {id: userId},
        select: {avatarPath: true}
    });
    if(!filePath?.avatarPath){
        return null
    }
    const {error} = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([filePath.avatarPath]);

    if(error){
        throw new Error(`Failed to remove asset from bucket: ${error.message}`);
    }
    return prisma.user.update({
        where: {id: userId},
        data: {
            avatarUrl: null,
            avatarPath: null
        },
        select: safeUserSelect
    });
};

export function userDelete(id: string){
    return prisma.user.delete({
        where: { id }
    });
};

export function findSubscription(userId?: string, id?: string, query?: SubscriptionQueryInput){
    if(id){
        return prisma.subscription.findUnique({
            where: {id}
        });
    }
    return prisma.subscription.findMany({
        where: {
            userId,
            ...(query?.membership !== undefined && {
                membership: query.membership
            }),
            ...(query?.plan !== undefined && {
                plan: {
                    name: query.plan
                }
            }),
            ...(query?.status !== undefined && {
                status: query.status
            })
        }
    });
};

export function postSubscription(userId: string, body: SubscriptionCreateInput){
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch(body.membership){
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
                        id: userId
                    }
                },
                plan: {
                    connect: {name: body.plan}
                },
                membership: body.membership,
                startDate: startDate,
                endDate: endDate,
                status: "ACTIVE"
            },
            include: {
                user: true,
                plan: true
            }
        });

        const price = await tx.planPrice.findUniqueOrThrow({
            where: {
                planId_membership: {
                    planId: subscription.planId,
                    membership: subscription.membership
                }
            }
        });

        const payment = await tx.payment.create({
            data: {
                userId,
                subscriptionId: subscription.id,
                status: "PENDING",
                amount: price.price
            }
        });

        return { subscription, payment }
    });
};

export function cancelSubscription(id: string){
    return prisma.subscription.update({
        where: {id},
        data: {status: "CANCELLED"}
    });
};

export function findPayment(userId?: string, id?: string, query?: PaymentQueryInput){
    if(id){
        return prisma.payment.findUnique({
            where: {id}
        });
    }

    return prisma.payment.findMany({
        where: {
            userId,
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
                    ...(query.minAmount !== undefined && {gte: query.minAmount}),
                    ...(query.maxAmount !== undefined && {lte: query.maxAmount})
                }
            })
        }
    });
};

export async function patchPayment(id: string){
    const payment = await prisma.payment.findUnique({
        where: {id}
    });

    if(payment?.status !== "PENDING"){
        return null;
    }

    return prisma.payment.update({
        where: {id},
        data: {
            status: "CANCELLED"
        }
    });
};

export function findSession(userId?: string, id?: string, query?: SessionQueryInput){
    if(id){
        return prisma.facilitySession.findUnique({
            where:{id}
        });
    }
    return prisma.facilitySession.findMany({
        where: {
            userId,
            ...(query?.facility !== undefined && {
                facility: {name: query.facility}
            }),
            ...((query?.checkInAfter !== undefined || query?.checkInBefore !== undefined) && {
                checkIn: {
                    ...(query?.checkInAfter !== undefined && {
                        gte: query.checkInAfter
                    }),
                    ...(query?.checkInBefore !== undefined && {
                        lte: query.checkInBefore
                    })
                }
            }),
            ...((query?.checkOutAfter !== undefined || query?.checkOutBefore !== undefined) && {
                checkOut: {
                    ...(query.checkOutAfter !== undefined && {
                        gte: query.checkOutAfter
                    }),
                    ...(query.checkOutBefore !== undefined && {
                        lte: query.checkOutBefore
                    })
                }
            })
        }
    });
};

export function postSession(userId: string, body: SessionCreateInput){
    return prisma.facilitySession.create({
        data: {
            user: {
                connect: {id: userId}
            },
            facility:{
                connect: {name: body.facility}
            },
            checkIn: new Date()
        }
    });
};

export function checkOut(id: string){
    return prisma.facilitySession.update({
        where: {id},
        data: {
            checkOut: new Date()
        }
    });
};