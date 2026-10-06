import { prisma } from "../lib/prisma.js";

export function findFacilities(id?: string){
    if(id){
        return prisma.facility.findUnique({
            where: {id}
        });
    }
    return prisma.facility.findMany();
};