import { prisma } from "../lib/prisma.js";
import { PlanQueryInput, PriceChangeInput } from "../schemas/plan.schemas.js";

export async function findPlan(id?:string, query?: PlanQueryInput){
    if(id){
        return prisma.plan.findUnique({
            where:{id},
            include: {
                price: true
            }
        });
    }
    return prisma.plan.findMany({
        where: {
            ...(query?.membership !== undefined && {
                price: {
                    some: {
                        membership: query.membership
                    }
                }
            }),
        },
        include: {
            price: true
        }
    });
};

export async function findPrice(id?: string, query?: PlanQueryInput){
    if(id){
        return prisma.plan.findUnique({
            where:{id},
            select: {
                price: true
            }
        });
    }
    return prisma.plan.findMany({
        where: {
            ...(query?.membership !== undefined && {
                price: {
                    some: {
                        membership: query.membership
                    }
                }
            }),
        },
        select: {
            price: true
        }
    });
};

export async function patchPlanPrice(id: string, body: PriceChangeInput){
    try {
        return await prisma.planPrice.update({
            where: {
                planId_membership:{
                    planId: id,
                    membership: body.membership
                }
            },
            data: {
                price: body.price
            }
        });
    } catch (error) {
        return null
    }
};

export function getFacilities(){
    return prisma.plan.findMany({
        include: {
            facilities: {
                include: {
                    facility: true
                }
            }
        }
    });
};