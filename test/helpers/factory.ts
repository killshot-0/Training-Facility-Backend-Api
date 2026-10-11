import { prisma } from "../../src/lib/prisma";
import { seed } from "../../prisma/seed.js"; 

export async function cleanDatabase() {
    await prisma.payment.deleteMany()
    await prisma.facilitySession.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.authSession.deleteMany()
    await prisma.account.deleteMany()
    await prisma.planFacility.deleteMany()
    await prisma.planPrice.deleteMany()
    await prisma.user.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()
    await prisma.plan.deleteMany()
    await prisma.facility.deleteMany()
};


export {seed};