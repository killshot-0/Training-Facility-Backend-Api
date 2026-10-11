import { prisma } from "../lib/prisma.js";
import { RoleChangeInput, PlanCreateInput, FacilityCreateInput, GetByRoleInput } from "../schemas/admin.schemas.js";

export function findUser(id?: string){
    if(id){
        return prisma.user.findUnique({
            where: {id}
        })
    }
    return prisma.user.findMany();
};

export async function patchRole(id: string, body: RoleChangeInput){
    try {
        return await prisma.user.update({
            where: {id},
            data: {
                role: {
                    connect: {
                        name: body.role
                    }
                }
            }
        });
    } catch (error) {
        return null
    }
};

export async function removeUser(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { role: { select: { name: true } } }
    });

    if (!user || user.role.name === "ADMIN") {
        return null;
    }

    return prisma.user.delete({
        where: { id }
    });
};

export async function postPlan(body: PlanCreateInput){
    try {
        return await prisma.plan.create({
            data: {
                name: body.plan
            }
        });
        
    } catch (error) {
        return null
    }
};

export async function removePlan(id: string){
    try {
        return await prisma.plan.delete({
            where: {id}
        });
    } catch (error) {
        return null
    }
};

export async function postFacility(body: FacilityCreateInput){
    try {
        return await prisma.facility.create({
            data: {
                name: body.facility
            }
        });
    } catch (error) {
        return null
    }
};

export async function removeFacility(id: string){
    try {
        return await prisma.facility.delete({
            where: {id}
        });
    } catch (error) {
        return null
    }
};

export function findUsersByRole(body: GetByRoleInput){
    return prisma.user.findMany({
        where: {
            role: {
                name: body.role
            }
        }
    });
};