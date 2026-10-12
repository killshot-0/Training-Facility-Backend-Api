import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed, createSubscriptionFixture } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';


describe("Subscription Tests", () => {
    let userToken: string;

    async function userRequest() {
        const agent = request.agent(app);
        agent.set("Authorization", `Bearer ${userToken}`);

        return agent;
    }

    async function createAnotherMember() {
        const role = await prisma.role.findUniqueOrThrow({
            where: { name: "MEMBER" }
        });

        return prisma.user.create({
            data: {
                name: "Another Member",
                email: "another@example.com",
                passwordHash: null,
                roleId: role.id
            }
        });
    }

    beforeEach(async () => {
        await cleanDatabase();
        await seed();

        await register();
        const response = await login();

        userToken = response.body.accessToken;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    describe("GET /api/subscriptions", () => {
        async function getAdminRequest() {
            const adminRole = await prisma.role.findUniqueOrThrow({
                where: { name: "ADMIN" }
            });

            await prisma.user.update({
                where: { email: validUser.email },
                data: { roleId: adminRole.id }
            });

            const response = await login();
            userToken = response.body.accessToken;

            return userRequest();
        }

        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/subscriptions");

            expect(res.status).toBe(401);
        });

        it("should reject users without the required permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/subscriptions");

            expect(res.status).toBe(403);
        });

        it("should return 404 when no subscriptions exist", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions");

            expect(res.status).toBe(404);
        });

        it("should return all subscriptions", async () => {
            const member = await createAnotherMember();
            await createSubscriptionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions");

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should filter subscriptions by userId", async () => {
            const member1 = await createAnotherMember();
            const member2 = await prisma.user.create({
                data: {
                    name: "Third Member",
                    email: "third@example.com",
                    passwordHash: null,
                    roleId: await prisma.role.findUniqueOrThrow({
                        where: { name: "MEMBER" }
                    }).then(role => role.id)
                }
            });

            await createSubscriptionFixture(member1.id);
            await createSubscriptionFixture(member2.id);

            const user = await getAdminRequest();

            const res = await user.get(
                `/api/subscriptions?userId=${member1.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].userId).toBe(member1.id);
        });

        it("should filter subscriptions by plan", async () => {
            const member = await createAnotherMember();

            await createSubscriptionFixture(member.id, { plan: "BASIC" });
            await createSubscriptionFixture(member.id, { plan: "PREMIUM" });

            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions?plan=BASIC");

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should filter subscriptions by membership", async () => {
            const member = await createAnotherMember();

            await createSubscriptionFixture(member.id, {
                membership: "MONTHLY"
            });
            await createSubscriptionFixture(member.id, {
                membership: "QUARTERLY"
            });

            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?membership=MONTHLY"
            );

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].membership).toBe("MONTHLY");
        });

        it("should filter subscriptions by status", async () => {
            const member = await createAnotherMember();

            const subscription = await createSubscriptionFixture(member.id);
            const cancelledSubscription = await createSubscriptionFixture(member.id);

            await prisma.subscription.update({
                where: { id: cancelledSubscription.subscription.id },
                data: { status: "CANCELLED" }
            });

            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?status=ACTIVE"
            );

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should reject an invalid userId query", async () => {
            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?userId=invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should reject an invalid plan query", async () => {
            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?plan=INVALID"
            );

            expect(res.status).toBe(400);
        });

        it("should reject an invalid membership query", async () => {
            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?membership=INVALID"
            );

            expect(res.status).toBe(400);
        });

        it("should reject an invalid status query", async () => {
            const user = await getAdminRequest();

            const res = await user.get(
                "/api/subscriptions?status=INVALID"
            );

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving subscriptions fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.subscription, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/subscriptions");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/subscriptions/:id", () => {
        async function getAdminRequest() {
            const adminRole = await prisma.role.findUniqueOrThrow({
                where: { name: "ADMIN" }
            });

            await prisma.user.update({
                where: { email: validUser.email },
                data: { roleId: adminRole.id }
            });

            const response = await login();
            userToken = response.body.accessToken;

            return userRequest();
        }

        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get(
                `/api/subscriptions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(401);
        });

        it("should reject users without the required permission", async () => {
            const user = await userRequest();

            const res = await user.get(
                `/api/subscriptions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(403);
        });

        it("should reject an invalid subscription ID", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the subscription does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user.get(
                `/api/subscriptions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(404);
        });

        it("should return a specific subscription", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user.get(
                `/api/subscriptions/${subscription.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.subscription.id).toBe(subscription.id);
        });

        it("should return 500 when retrieving a subscription fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.subscription, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get(
                `/api/subscriptions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/subscriptions/users", () => {
        async function getAdminRequest() {
            const adminRole = await prisma.role.findUniqueOrThrow({
                where: { name: "ADMIN" }
            });

            await prisma.user.update({
                where: { email: validUser.email },
                data: { roleId: adminRole.id }
            });

            const response = await login();
            userToken = response.body.accessToken;

            return userRequest();
        }

        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/subscriptions/users");

            expect(res.status).toBe(401);
        });

        it("should reject users without the required permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/subscriptions/users");

            expect(res.status).toBe(403);
        });

        it("should return 404 when no users have subscriptions", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions/users");

            expect(res.status).toBe(404);
        });

        it("should return users with their subscriptions", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user.get("/api/subscriptions/users");

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(1);
            expect(res.body.users[0].id).toBe(member.id);
            expect(res.body.users[0].subscriptions).toHaveLength(1);
            expect(res.body.users[0].subscriptions[0].id).toBe(subscription.id);
        });

        it("should return 500 when retrieving users with subscriptions fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.user, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/subscriptions/users");

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/subscriptions", () => {
        async function getAdminRequest() {
            const adminRole = await prisma.role.findUniqueOrThrow({
                where: { name: "ADMIN" }
            });

            await prisma.user.update({
                where: { email: validUser.email },
                data: { roleId: adminRole.id }
            });

            const response = await login();
            userToken = response.body.accessToken;

            return userRequest();
        }

        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .post("/api/subscriptions")
                .send({
                    userId: crypto.randomUUID(),
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(401);
        });

        it("should reject users without the required permission", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: crypto.randomUUID(),
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(403);
        });

        it("should reject an invalid userId", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: "invalid-id",
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(400);
        });

        it("should reject an invalid plan", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: member.id,
                    plan: "INVALID",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(400);
        });

        it("should reject an invalid membership", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: member.id,
                    plan: "BASIC",
                    membership: "INVALID"
                });

            expect(res.status).toBe(400);
        });

        it("should reject a missing userId", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(400);
        });

        it("should create a subscription and payment successfully", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: member.id,
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(201);
            expect(res.body.subscription.userId).toBe(member.id);
            expect(res.body.subscription.plan.name).toBe("BASIC");
            expect(res.body.subscription.membership).toBe("MONTHLY");
            expect(res.body.subscription.status).toBe("ACTIVE");
            expect(res.body.payment.subscriptionId).toBe(res.body.subscription.id);
            expect(res.body.payment.userId).toBe(member.id);
        });

        it("should return 500 when the target user does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: crypto.randomUUID(),
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(500);
        });

        it("should return 500 when subscription creation fails", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            vi.spyOn(prisma, "$transaction")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .post("/api/subscriptions")
                .send({
                    userId: member.id,
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/subscriptions/:id/status", () => {
        async function getAdminRequest() {
            const adminRole = await prisma.role.findUniqueOrThrow({
                where: { name: "ADMIN" }
            });

            await prisma.user.update({
                where: { email: validUser.email },
                data: { roleId: adminRole.id }
            });

            const response = await login();
            userToken = response.body.accessToken;

            return userRequest();
        }

        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch(`/api/subscriptions/${crypto.randomUUID()}/status`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(401);
        });

        it("should reject users without the required permission", async () => {
            const user = await userRequest();

            const res = await user
                .patch(`/api/subscriptions/${crypto.randomUUID()}/status`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(403);
        });

        it("should reject an invalid subscription ID", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/subscriptions/invalid-id/status")
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(400);
        });

        it("should reject an invalid status", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${crypto.randomUUID()}/status`)
                .send({ status: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should reject a missing status", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${crypto.randomUUID()}/status`)
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 when the subscription does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${crypto.randomUUID()}/status`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(404);
        });

        it("should change the subscription status successfully", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);
            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${subscription.id}/status`)
                .send({ status: "SUSPENDED" });

            expect(res.status).toBe(200);
            expect(res.body.subscription.id).toBe(subscription.id);
            expect(res.body.subscription.status).toBe("SUSPENDED");
        });

        it("should reject changing the status to its current status", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);
            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${subscription.id}/status`)
                .send({ status: "ACTIVE" });

            expect(res.status).toBe(404);
        });

        it("should reject changing an expired subscription", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);

            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: "EXPIRED" }
            });

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/subscriptions/${subscription.id}/status`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(404);
        });

        it("should return 500 when retrieving the subscription for status change fails", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);
            const user = await getAdminRequest();

            vi.spyOn(prisma.subscription, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/subscriptions/${subscription.id}/status`)
                .send({ status: "SUSPENDED" });

            expect(res.status).toBe(500);
        });

        it("should return 500 when updating the subscription status fails", async () => {
            const member = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(member.id);
            const user = await getAdminRequest();

            vi.spyOn(prisma.subscription, "update")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/subscriptions/${subscription.id}/status`)
                .send({ status: "SUSPENDED" });

            expect(res.status).toBe(500);
        });
    });
});