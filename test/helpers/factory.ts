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

export async function createSubscriptionFixture(
        memberId: string,
        data?: {
            membership?: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";
            status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
            plan?: "BASIC" | "PREMIUM";
        }
    ) {
        const membership = data?.membership ?? "MONTHLY";
        const planName = data?.plan ?? "BASIC";

        return prisma.$transaction(async (tx) => {
            const plan = await tx.plan.findUniqueOrThrow({
                where: { name: planName },
            });

            const planPrice = await tx.planPrice.findUniqueOrThrow({
                where: {
                    planId_membership: {
                        planId: plan.id,
                        membership,
                    },
                },
            });

            const subscription = await tx.subscription.create({
                data: {
                    userId: memberId,
                    planId: plan.id,
                    membership,
                    status: data?.status ?? "ACTIVE",
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            const payment = await tx.payment.create({
                data: {
                    userId: memberId,
                    subscriptionId: subscription.id,
                    amount: planPrice.price,
                    status: "PENDING",
                },
            });

            return { subscription, payment };
        });
    }

export async function createPaymentFixture(
    userId: string,
    options?: {
        planName?: "BASIC" | "PREMIUM";
        status?: "PENDING" | "COMPLETED" | "CANCELLED";
        amount?: number;
        paymentUrl?: string | null;
        paymentPath?: string | null;
    }
) {
    const plan = await prisma.plan.findUniqueOrThrow({
        where: { name: options?.planName ?? "BASIC" }
    });

    const subscription = await prisma.subscription.create({
        data: {
            userId,
            planId: plan.id,
            membership: "MONTHLY",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "ACTIVE"
        }
    });

    return prisma.payment.create({
        data: {
            userId,
            subscriptionId: subscription.id,
            amount: options?.amount ?? 2000,
            status: options?.status ?? "PENDING",
            paymentUrl: options?.paymentUrl ?? null,
            paymentPath: options?.paymentPath ?? null
        }
    });
}

export async function createSessionFixture(
            userId: string,
            data?: {
                facility?: "GYM" | "FOOTBALL" | "SWIMMING_POOL" | "SAUNA" | "SHOWER";
                checkIn?: Date;
                checkOut?: Date | null;
            }
        ) {
            return prisma.facilitySession.create({
                data: {
                    user: {
                        connect: { id: userId },
                    },
                    facility: {
                        connect: {
                            name: data?.facility ?? "GYM",
                        },
                    },
                    checkIn: data?.checkIn ?? new Date(),
                    checkOut: data?.checkOut ?? null,
                },
            });
        }
export {seed};