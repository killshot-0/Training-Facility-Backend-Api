import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed, createSessionFixture } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';


describe("Plan Tests", () => {
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

    describe("GET /api/plans", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/plans");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/plans");

            expect(res.status).toBe(403);
        });

        it("should return all plans", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/plans");

            expect(res.status).toBe(200);
            expect(res.body.plan).toHaveLength(2);
            expect(res.body.plan.map((plan: any) => plan.name))
                .toEqual(expect.arrayContaining(["BASIC", "PREMIUM"]));
        });

        it("should filter plans by membership", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/plans")
                .query({ membership: "MONTHLY" });

            expect(res.status).toBe(200);

            for (const plan of res.body.plan) {
                expect(
                    plan.price.some((price: any) => price.membership === "MONTHLY")
                ).toBe(true);
            }
        });

        it("should return an empty array when no plans match the filter", async () => {
            const user = await getAdminRequest();

            // Remove the matching prices so no plan matches this membership.
            await prisma.planPrice.deleteMany({
                where: { membership: "YEARLY" }
            });

            const res = await user
                .get("/api/plans")
                .query({ membership: "YEARLY" });

            expect(res.status).toBe(200);
            expect(res.body.plan).toHaveLength(0);
        });

        it("should return 400 for an invalid membership", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/plans")
                .query({ membership: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving plans fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.plan, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/plans");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/plans/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .get("/api/plans/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/plans/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid plan ID", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/plans/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the plan does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/plans/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(404);
        });

        it("should return the requested plan", async () => {
            const plan = await prisma.plan.findUniqueOrThrow({
                where: { name: "BASIC" }
            });

            const user = await getAdminRequest();

            const res = await user.get(`/api/plans/${plan.id}`);

            expect(res.status).toBe(200);
            expect(res.body.plan.id).toBe(plan.id);
            expect(res.body.plan.name).toBe("BASIC");
        });

        it("should return 500 when retrieving a plan fails", async () => {
            const plan = await prisma.plan.findUniqueOrThrow({
                where: { name: "BASIC" }
            });

            const user = await getAdminRequest();

            vi.spyOn(prisma.plan, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get(`/api/plans/${plan.id}`);

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/plans/price", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/plans/price");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/plans/price");

            expect(res.status).toBe(403);
        });

        it("should return prices for all plans", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/plans/price");

            expect(res.status).toBe(200);
            expect(res.body.price).toHaveLength(2);

            for (const plan of res.body.price) {
                expect(plan.price).toBeDefined();
            }
        });

        it("should filter prices by membership", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/plans/price")
                .query({ membership: "MONTHLY" });

            expect(res.status).toBe(200);
        });

        it("should return an empty array when no prices match the filter", async () => {
            const user = await getAdminRequest();

            await prisma.planPrice.deleteMany({
                where: { membership: "YEARLY" }
            });

            const res = await user
                .get("/api/plans/price")
                .query({ membership: "YEARLY" });

            expect(res.status).toBe(200);
            expect(res.body.price).toHaveLength(0);
        });

        it("should return 400 for an invalid membership", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/plans/price")
                .query({ membership: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving plan prices fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.plan, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/plans/price");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/plans/facilities", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/plans/facilities");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/plans/facilities");

            expect(res.status).toBe(403);
        });

        it("should return plans and their associated facilities", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/plans/facilities");

            expect(res.status).toBe(200);
            expect(res.body.facilities).toHaveLength(2);

            for (const plan of res.body.facilities) {
                expect(plan.facilities).toBeDefined();

                for (const item of plan.facilities) {
                    expect(item.facility).toBeDefined();
                }
            }
        });

        it("should return 500 when retrieving plan facilities fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.plan, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/plans/facilities");

            expect(res.status).toBe(500);
        });
    });
});