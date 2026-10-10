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

export function patchRole(id: string, body: RoleChangeInput){
    return prisma.user.update({
        where: {id},
        data: {
            role: {
                connect: {
                    name: body.role
                }
            }
        }
    });
};

export function removeUser(id: string){
    return prisma.user.delete({
        where: {id}
    });
};

export function postPlan(body: PlanCreateInput){
    return prisma.plan.create({
        data: {
            name: body.plan
        }
    });
};

export function removePlan(id: string){
    return prisma.plan.delete({
        where: {id}
    });
};

export function postFacility(body: FacilityCreateInput){
    return prisma.facility.create({
        data: {
            name: body.facility
        }
    });
};

export function removeFacility(id: string){
    return prisma.facility.delete({
        where: {id}
    });
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