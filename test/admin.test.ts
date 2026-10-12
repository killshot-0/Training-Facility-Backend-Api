import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import request, { cookies } from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { env } from '../src/config/env.js';
import { register, login } from './auth.test.js';
import { supabase } from '../src/lib/storage.js';
import * as sessionServices from "../src/services/auth.service.js";
import { createSubscriptionFixture, createSessionFixture } from './helpers/factory.js';



describe("Admin Tests", () => {
    let adminToken: string;

    beforeEach(async () => {
        await cleanDatabase();
        await seed();

        const response = await request(app).post("/api/auth/login").send({email: "eyosik55@gmail.com", password: env.ADMIN_SECRET}).expect(200);

        adminToken = response.body.accessToken;
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    async function userRequest() {
        await register();
        const response = await login();

        const agent = request.agent(app);
        agent.set("Authorization", `Bearer ${response.body.accessToken}`);

        return agent;
    }

    async function adminRequest() {
        const agent = request.agent(app);
        agent.set("Authorization", `Bearer ${adminToken}`);
        return agent;
    }
    async function createMember() {
        await userRequest();

        const member = await prisma.user.findFirst({
            where: { role: { name: "MEMBER" } },
            orderBy: { createdAt: "desc" },
        });

        if (!member) throw new Error("Member not found");

        return member;
    }


    describe("GET /api/admin/users", () => {
        it("should reject an unauthenticated admin", async () => {
            const res = await request(app).get("/api/admin/users");

            expect(res.status).toBe(401)
            expect(res.body).toHaveProperty("message", "Authentication required");
        });

        it("should reject an unautherized user", async () => {
            const user = await userRequest();

            const res = await user.get("/api/admin/users");

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty("message", "Unauthorized")
        });

        it("should return a list of users for a valid admin", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/users");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message", "Users found!");
            expect(res.body).toHaveProperty("users");
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeGreaterThan(0);
        });

        it("should return 404 for empty users", async () => {
            const admin = await adminRequest();

            await prisma.user.deleteMany({
                where: {
                    email: { not: "eyosik55@gmail.com" }
                },  
            });
            const res = await admin.get("/api/admin/users");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message", "Users found!");
        });
    });
    
    describe("GET /api/admin/users", () => {
        it("should reject an unauthenticated admin", async () => {
            const res = await request(app).get("/api/admin/users/00000000-0000-4000-8000-000000000000");

            expect(res.status).toBe(401)
            expect(res.body).toHaveProperty("message", "Authentication required");
        });

        it("should reject an unautherized user", async () => {
            const user = await userRequest();

            const res = await user.get("/api/admin/users/00000000-0000-4000-8000-000000000000");

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty("message", "Unauthorized")
        });

        it("should return 400 for an invalid id", async () => {
            const admin = await adminRequest();
            
            const res = await admin.get("/api/admin/users/invalid-id");
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });
        
        it("should return a user for a valid id", async () => {
            const admin = await adminRequest();

            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: "test@example.com",
                    passwordHash: "hashedPassword",
                    role: { connect: { name: "MEMBER" } }
                }
            });

            const res = await admin.get(`/api/admin/users/${user.id}`);

            expect(res.status).toBe(200);
            expect(res.body.users.id).toBe(user.id);
        });

        it("should return 404 for an id that doesn't exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/users/00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe(404);
        });
    });

    describe("PATCH api/admin/users/:id/role", () => {
        it("should reject an unauthenticated admin", async () => {
            await request(app)
                .patch("/api/admin/users/00000000-0000-4000-8000-000000000000/role")
                .send({ role: "COACH" })
                .expect(401);
        });

        it("should reject an unautherized user", async () => {
            const user = await userRequest();

            await user
                .patch("/api/admin/users/00000000-0000-4000-8000-000000000000/role")
                .send({ role: "COACH" })
                .expect(403);
        });

        it("should successfully change a user's role", async () => {
            const admin = await adminRequest();

            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: "test@example.com",
                    passwordHash: "hashedPassword",
                    role: { connect: { name: "MEMBER" } }
                }
            });

            const res = await admin
                .patch(`/api/admin/users/${user.id}/role`)
                .send({ role: "COACH" })
                .expect(200);

            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { role: true }
            });

            expect(updatedUser?.role.name).toBe("COACH");
        });

        it("should return 400 for an invalid user ID", async () => {
            const admin = await adminRequest();

            await admin
                .patch("/api/admin/users/invalid-id/role")
                .send({ role: "COACH" })
                .expect(400);
        });

        it("should return 400 for an invalid role", async () => {
            const admin = await adminRequest();


            await admin
                .patch(`/api/admin/users/00000000-0000-0000-0000-000000000000/role`)
                .send({ role: "INVALID_ROLE" })
                .expect(400);
        });

        it("should return 400 when the role is missing", async () => {
            const admin = await adminRequest();

            await admin
                .patch(`/api/admin/users/00000000-0000-0000-0000-000000000000/role`)
                .send({})
                .expect(400);
        });

        it("should return 404 for a non-existent user", async () => {
            const admin = await adminRequest();

            await admin
                .patch("/api/admin/users/00000000-0000-0000-0000-000000000000/role")
                .send({ role: "COACH" })
                .expect(404);
        });
    });

    describe("DELETE api/admin/users/:id", () => {

        it("should reject an unauthenticated admin", async () => {
            const res = await request(app).delete(`/api/admin/users/00000000-0000-4000-8000-000000000000`);

            expect(res.status).toBe(401);
        });

        it("should reject an unautherized user", async () => {
            const user = await userRequest();

            const res = await user.delete(`/api/admin/users/00000000-0000-4000-8000-000000000000`);

            expect(res.status).toBe(403);
        });

        it("should successfully delete an existing user", async () => {
            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: "test@example.com",
                    passwordHash: "hashedPassword",
                    role: { connect: { name: "MEMBER" } }
                }
            });

            const admin = await adminRequest();

            const res = await admin.delete(`/api/admin/users/${user.id}`);

            expect(res.status).toBe(200);

            const deletedUser = await prisma.user.findUnique({
                where: { id: user.id }
            });

            expect(deletedUser).toBeNull();
        });

        it("should return 400 for an invalid user ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete("/api/admin/users/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 if the user does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/users/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });

        it("should not delete an admin user", async () => {
            const adminUser = await prisma.user.findUnique({
                where: { email: "eyosik55@gmail.com" }
            });

            const admin = await adminRequest();

            const res = await admin.delete(`/api/admin/users/${adminUser!.id}`);

            expect(res.status).toBe(404);

            const existingAdmin = await prisma.user.findUnique({
                where: { id: adminUser!.id }
            });

            expect(existingAdmin).not.toBeNull();
        });
    });

    describe("POST api/admin/plan", () => {
        it("should reject an unauthenticated admin", async () => {
            const res = await request(app)
                .post("/api/admin/plan")
                .send({ plan: "BASIC" });

            expect(res.status).toBe(401);
        });

        it("should reject an unautherized user", async () => {
            const member = await userRequest();

            const res = await member
                .post("/api/admin/plan")
                .send({ plan: "BASIC" });

            expect(res.status).toBe(403);
        });

        it("should successfully create a plan", async () => {
            await prisma.plan.deleteMany();
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/plan")
                .send({ plan: "BASIC" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message","Plan successfully created!");
            expect(res.body.plan).toBeDefined();
            expect(res.body.plan.name).toBe("BASIC");
        });

        it("should return 400 if the plan type is invalid", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/plan")
                .send({ plan: "GOLD" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the plan field is missing", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/plan")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 if the service cannot create the plan", async () => {

            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/plan")
                .send({ plan: "BASIC" });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty("message", "Unable to create plan!");
        });
    });

    describe("PATCH api/admin/plan/:id", () => {
        it("should reject an unauthenticated admin", async () => {
            const res = await request(app)
                .patch(`/api/admin/plan/00000000-0000-0000-0000-000000000000`)
                .send({ membership: "MONTHLY", price: 1500 });

            expect(res.status).toBe(401);
        });

        it("should reject an unautherized user", async () => {
            const member = await userRequest();

            const res = await member
                .patch(`/api/admin/plan/00000000-0000-0000-0000-000000000000`)
                .send({ membership: "MONTHLY", price: 1500 });

            expect(res.status).toBe(403);
        });

        it("should successfully change the plan price", async () => {
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/plan/${plan!.id}`)
                .send({ membership: "MONTHLY", price: 1500 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message", "Prices Changed!");
            expect(res.body.price).toBeDefined();

            const updatedPrice = await prisma.planPrice.findUnique({
                where: {
                    planId_membership: {
                        planId: plan!.id,
                        membership: "MONTHLY"
                    }
                }
            });

            expect(Number(updatedPrice!.price)).toBe(1500);
        });

        it("should return 400 for an invalid plan ID", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/plan/invalid-id")
                .send({ membership: "MONTHLY", price: 1500 });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership type is invalid", async () => {
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/plan/${plan!.id}`)
                .send({ membership: "WEEKLY", price: 1500 });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the price is negative", async () => {
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/plan/${plan!.id}`)
                .send({ membership: "MONTHLY", price: -100 });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the price is missing", async () => {
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/plan/${plan!.id}`)
                .send({ membership: "MONTHLY" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership is missing", async () => {
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/plan/${plan!.id}`)
                .send({ price: 1500 });

            expect(res.status).toBe(400);
        });

        it("should return 404 if the plan does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/plan/00000000-0000-0000-0000-000000000000")
                .send({ membership: "MONTHLY", price: 1500 });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE api/admin/plan/:id", () => {
        it("should reject an unauthenticated admin", async () => {
            const res = await request(app)
                .delete(`/api/admin/plan/00000000-0000-0000-0000-000000000000`);

            expect(res.status).toBe(401);
        });

        it("should reject an unautherized user", async () => {
            const member = await userRequest();

            const res = await member.delete(`/api/admin/plan/00000000-0000-0000-0000-000000000000`);

            expect(res.status).toBe(403);
        });

        it("should successfully delete an existing plan", async () => {
            
            const plan = await prisma.plan.findUnique({
                where: { name: "BASIC" }
            });

            const admin = await adminRequest();

            const res = await admin.delete(`/api/admin/plan/${plan!.id}`);

            expect(res.status).toBe(200);

            const deletedPlan = await prisma.plan.findUnique({
                where: { id: plan!.id }
            });

            expect(deletedPlan).toBeNull();
        });

        it("should return 400 for an invalid plan ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete("/api/admin/plan/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 if the plan does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/plan/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/facilities", () => {

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app).get("/api/admin/facilities");
            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get("/api/admin/facilities");

            expect(res.status).toBe(403);
        });

        it("should return all available facilities", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/facilities");

            expect(res.status).toBe(200);
            expect(res.body.facilities).toBeDefined();
        });
        it("should return 404 if no facilities are found", async () => {
            const admin = await adminRequest();

            await prisma.facility.deleteMany();
            const res = await admin.get("/api/admin/facilities");

            expect(res.status).toBe(404);
            expect(res.body.facilities).not.toBeDefined();
        });
    });

    describe("GET api/admin/facilities/:id", () => {

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .get(`/api/admin/facilities/00000000-0000-0000-0000-000000000000`);

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .get(`/api/admin/facilities/00000000-0000-0000-0000-000000000000}`);

            expect(res.status).toBe(403);
        });

        it("should return a specific facility", async () => {
            const facility = await prisma.facility.findFirst();
            const admin = await adminRequest();

            const res = await admin
                .get(`/api/admin/facilities/${facility!.id}`);

            expect(res.status).toBe(200);
            expect(res.body.facilities).toBeDefined();
        });

        it("should return 400 for an invalid facility ID", async () => {
            const admin = await adminRequest();

            const res = await admin
                .get("/api/admin/facilities/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 if the facility does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/facilities/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("POST api/admin/facilities", () => {

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .post("/api/admin/facilities")
                .send({ name: "GYM" });

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .post("/api/admin/facilities")
                .send({ name: "GYM" });

            expect(res.status).toBe(403);
        });

        it("should successfully create a facility", async () => {
            const admin = await adminRequest();

            await prisma.facility.deleteMany();
            const res = await admin
                .post("/api/admin/facilities")
                .send({ facility: "GYM" });

            expect(res.status).toBe(200);
            expect(res.body.facility).toBeDefined();
        });

        it("should return 400 if the facility type is invalid", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/facilities")
                .send({ name: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the facility type is missing", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/facilities")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 if the facility cannot be created", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/facilities")
                .send({ facility: "GYM" });

            expect(res.status).toBe(404);
            expect(res.body.facility).not.toBeDefined();
        });
    });

    describe("DELETE api/admin/facilities/:id", () => {

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .delete(`/api/admin/facilities/00000000-0000-0000-0000-000000000000`);

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .delete(`/api/admin/facilities/00000000-0000-0000-0000-000000000000`);

            expect(res.status).toBe(403);
        });

        it("should successfully delete a facility", async () => {
            await prisma.facility.deleteMany();
            const facility = await prisma.facility.create({
                data: { name: "GYM" }
            });

            const admin = await adminRequest();

            const res = await admin
                .delete(`/api/admin/facilities/${facility.id}`);

            expect(res.status).toBe(200);

            const deletedFacility = await prisma.facility.findUnique({
                where: { id: facility.id }
            });

            expect(deletedFacility).toBeNull();
        });

        it("should return 400 for an invalid facility ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/facilities/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if the facility does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/facilities/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/role/users", () => {

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .get("/api/admin/role/users")
                .send({ role: "MEMBER" });

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .get("/api/admin/role/users")
                .send({ role: "MEMBER" });

            expect(res.status).toBe(403);
        });

        it("should successfully return users with the specified role", async () => {
            const admin = await adminRequest();

            await prisma.user.create({
                data: {
                    name: "eyosi",
                    email: "eyosik21@gmail.com",
                    role: {
                        connect: {
                            name: "MEMBER"
                        }
                    }
                }
            });
            const res = await admin
                .get("/api/admin/role/users")
                .send({ role: "MEMBER" });

            expect(res.status).toBe(200);
        });

        it("should return 400 if the role is invalid", async () => {
            const admin = await adminRequest();

            const res = await admin
                .get("/api/admin/role/users")
                .send({ role: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the role is missing", async () => {
            const admin = await adminRequest();

            const res = await admin
                .get("/api/admin/role/users")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 if no users have the specified role", async () => {
            const admin = await adminRequest();

            await prisma.user.deleteMany({
                where: {
                    role: { name: "MEMBER" }
                }
            });

            const res = await admin
                .get("/api/admin/role/users")
                .send({ role: "MEMBER" });

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/subscriptions", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app).get("/api/admin/subscriptions");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get("/api/admin/subscriptions");

            expect(res.status).toBe(403);
        });

        it("should successfully return subscriptions", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/subscriptions");

            expect(res.status).toBe(200);
        });

        it("should filter subscriptions by userId", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                membership: "MONTHLY",
            });

            const subscription = await prisma.subscription.findFirst();

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/subscriptions?userId=${subscription!.userId}`
            );

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.subscription)).toBe(true);

            for (const item of res.body.subscription) {
                expect(item.userId).toBe(subscription!.userId);
            }
        });

        it("should return 400 for an invalid userId", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/subscriptions?userId=invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if no subscriptions are found", async () => {
            await prisma.payment.deleteMany();
            await prisma.subscription.deleteMany();

            const admin = await adminRequest();

            const res = await admin.get(`/api/admin/subscriptions`);

            expect(res.status).toBe(404);
        });
        
        it("should filter subscriptions by membership", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            await createSubscriptionFixture(member1.id, {
                membership: "MONTHLY",
            });

            await createSubscriptionFixture(member2.id, {
                membership: "QUARTERLY",
            });

            const admin = await adminRequest();

            const res = await admin.get(`/api/admin/subscriptions?membership=MONTHLY`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].membership).toBe("MONTHLY");
        });

        it("should filter subscriptions by status", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });

            await createSubscriptionFixture(member2.id, {
                status: "SUSPENDED",
            });
            const admin = await adminRequest();
            const res = await admin.get(`/api/admin/subscriptions?status=SUSPENDED`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].status).toBe("SUSPENDED");
        });

        it("should filter subscriptions by plan", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            await createSubscriptionFixture(member1.id, {
                plan: "BASIC",
            });

            await createSubscriptionFixture(member2.id, {
                plan: "PREMIUM",
            });
            const admin = await adminRequest();
            const res = await admin.get(`/api/admin/subscriptions?plan=PREMIUM`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should combine multiple filters", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            await createSubscriptionFixture(member1.id, {
                membership: "MONTHLY",
                status: "ACTIVE",
                plan: "BASIC",
            });

            await createSubscriptionFixture(member2.id, {
                membership: "QUARTERLY",
                status: "SUSPENDED",
                plan: "PREMIUM",
            });
            const admin = await adminRequest();

            const res = await admin.get(`/api/admin/subscriptions?userId=${member1.id}&membership=MONTHLY&status=ACTIVE&plan=BASIC`
            );

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should return 400 for an invalid membership", async () => {
            const admin = await adminRequest();

            const res = await admin.get(`/api/admin/subscriptions?membership=WEEKLY`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid status", async () => {
            const admin = await adminRequest();
            const res = await admin.get(`/api/admin/subscriptions?status=INVALID`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid plan", async () => {
            const admin = await adminRequest();
            const res = await admin.get(`/api/admin/subscriptions?plan=STANDARD`);

            expect(res.status).toBe(400);
        });
    });

    describe("GET api/admin/subscriptions/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .get("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .get("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe(403);
        });

        it("should return a specific subscription", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });

            const subscription = await prisma.subscription.findFirst();

            const admin = await adminRequest();

            const res = await admin.get(`/api/admin/subscriptions/${subscription!.id}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toBeDefined();
            expect(res.body.subscription.id).toBe(subscription!.id);
        });

        it("should return 400 for an invalid subscription ID", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/subscriptions/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 if the subscription does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/subscriptions/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/subscriptions/users", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app).get("/api/admin/subscriptions/users");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get("/api/admin/subscriptions/users");

            expect(res.status).toBe(403);
        });

        it("should successfully return users with their subscriptions", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/subscriptions/users");

            expect(res.status).toBe(200);
            expect(res.body.users).toBeDefined();
            expect(Array.isArray(res.body.users)).toBe(true);
        });

        it("should return 404 if no users have subscriptions", async () => {
            await prisma.payment.deleteMany();
            await prisma.subscription.deleteMany();

            const admin = await adminRequest();

            const res = await admin.get("/api/admin/subscriptions/users");

            expect(res.status).toBe(404);
            expect(res.body.users).not.toBeDefined();
        });
    });

    describe("POST /api/admin/subscriptions", () => {
        const validBody = {
            userId: "00000000-0000-4000-8000-000000000001",
            plan: "BASIC",
            membership: "MONTHLY"
        };

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .post("/api/admin/subscriptions")
                .send(validBody);

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/admin/subscriptions")
                .send(validBody);

            expect(res.status).toBe(403);
        });

        it("should create a subscription and payment successfully", async () => {
            const member = await createMember();
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/subscriptions")
                .send({
                    userId: member.id,
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(201);
            expect(res.body.subscription).toBeDefined();
            expect(res.body.payment).toBeDefined();

            expect(res.body.subscription.userId).toBe(member.id);
            expect(res.body.subscription.membership).toBe("MONTHLY");
            expect(res.body.subscription.status).toBe("ACTIVE");

            expect(res.body.payment.userId).toBe(member.id);
            expect(res.body.payment.subscriptionId)
                .toBe(res.body.subscription.id);
            expect(res.body.payment.status).toBe("PENDING");

            const subscription = await prisma.subscription.findUnique({
                where: { id: res.body.subscription.id }
            });

            const payment = await prisma.payment.findUnique({
                where: { id: res.body.payment.id }
            });

            expect(subscription).not.toBeNull();
            expect(payment).not.toBeNull();
        });

        it("should return 400 if the userId is not a valid UUID", async () => {
            const admin = await adminRequest()
            const res = await admin
                .post("/api/admin/subscriptions")
                .send({
                    ...validBody,
                    userId: "invalid-id"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the plan is invalid", async () => {
            const admin = await adminRequest()
            const res = await admin
                .post("/api/admin/subscriptions")
                .send({
                    ...validBody,
                    plan: "STANDARD"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership is invalid", async () => {
            const admin = await adminRequest()
            const res = await admin
                .post("/api/admin/subscriptions")
                .send({
                    ...validBody,
                    membership: "WEEKLY"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the plan is missing", async () => {
            const { plan, ...body } = validBody;

            const admin = await adminRequest()
            const res = await admin 
                .post("/api/admin/subscriptions")
                .send(body);

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership is missing", async () => {
            const { membership, ...body } = validBody;

            const admin = await adminRequest()
            const res = await admin
                .post("/api/admin/subscriptions")
                .send(body);

            expect(res.status).toBe(400);
        });

        it("should return 400 if the userId is missing", async () => {
            const { userId, ...body } = validBody;

            const admin = await adminRequest()
            const res = await admin
                .post("/api/admin/subscriptions")
                .send(body);

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH api/admin/subscriptions/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .patch("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000")
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .patch("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000")
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(403);
        });

        it("should successfully change a subscription status", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });

            const subscription = await prisma.subscription.findFirst({
                where: { status: "ACTIVE" }
            });

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/subscriptions/${subscription!.id}`)
                .send({ status: "SUSPENDED" });

            expect(res.status).toBe(200);
            expect(res.body.subscription.status).toBe("SUSPENDED");

            const updated = await prisma.subscription.findUnique({
                where: { id: subscription!.id }
            });

            expect(updated!.status).toBe("SUSPENDED");
        });

        it("should return 400 for an invalid subscription ID", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/subscriptions/invalid-id")
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid status", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });
            const subscription = await prisma.subscription.findFirst();
            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/subscriptions/${subscription!.id}`)
                .send({ status: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if status is missing", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });
            const subscription = await prisma.subscription.findFirst();
            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/subscriptions/${subscription!.id}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 if the subscription does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000")
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE api/admin/subscriptions/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .delete("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .delete("/api/admin/subscriptions/00000000-0000-0000-0000-000000000000");

            expect(res.status).toBe(403);
        });

        it("should successfully delete a subscription", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id, {
                status: "ACTIVE",
            });
            const subscription = await prisma.subscription.findFirst();

            const admin = await adminRequest();

            const res = await admin
                .delete(`/api/admin/subscriptions/${subscription!.id}`);

            expect(res.status).toBe(200);

            const deleted = await prisma.subscription.findUnique({
                where: { id: subscription!.id }
            });

            expect(deleted).toBeNull();
        });

        it("should return 400 for an invalid subscription ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/subscriptions/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if the subscription does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/subscriptions/00000000-0000-0000-0000-000000000000"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/payments", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app).get("/api/admin/payments");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get("/api/admin/payments");

            expect(res.status).toBe(403);
        });

        it("should successfully return payments", async () => {
            const member = await createMember();
            await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.get("/api/admin/payments");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.payment)).toBe(true);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should filter payments by userId", async () => {
            const member1 = await createMember();

            await createSubscriptionFixture(member1.id);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments?userId=${member1.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].userId).toBe(member1.id);
        });

        it("should filter payments by status", async () => {
            const member1 = await createMember();

            const result = await createSubscriptionFixture(member1.id);

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?status=PENDING"
            );

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].id).toBe(result.payment.id);
        });

        it("should filter payments by plan", async () => {
            const member = await createMember();

            const result = await createSubscriptionFixture(member.id, {
                plan: "PREMIUM",
            });

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?plan=PREMIUM"
            );

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].id).toBe(result.payment.id);
        });

        it("should filter payments by minimum amount", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const amount = Number(result.payment.amount);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments?minAmount=${amount}`
            );

            expect(res.status).toBe(200);

            for (const payment of res.body.payment) {
                expect(Number(payment.amount)).toBeGreaterThanOrEqual(amount);
            }
        });

        it("should filter payments by maximum amount", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const amount = Number(result.payment.amount);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments?maxAmount=${amount}`
            );

            expect(res.status).toBe(200);

            for (const payment of res.body.payment) {
                expect(Number(payment.amount)).toBeLessThanOrEqual(amount);
            }
        });

        it("should combine multiple filters", async () => {
            const member1 = await createMember();

            const result = await createSubscriptionFixture(member1.id, {
                plan: "BASIC",
            });

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments?userId=${member1.id}&plan=BASIC&status=PENDING`
            );

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].id).toBe(result.payment.id);
        });

        it("should return 400 for an invalid userId", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?userId=invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid plan", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?plan=STANDARD"
            );

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid status", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?status=INVALID"
            );

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative minimum amount", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?minAmount=-100"
            );

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative maximum amount", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments?maxAmount=-100"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if no payments are found", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/payments");

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/payments/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .get("/api/admin/payments/some-id");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get("/api/admin/payments/some-id");

            expect(res.status).toBe(403);
        });

        it("should successfully return a specific payment", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments/${result.payment.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.payment.id).toBe(result.payment.id);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/payments/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments/00000000-0000-4000-8000-000000000001"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET api/admin/payments/:id/receipt", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .get("/api/admin/payments/some-id/receipt");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.get(
                "/api/admin/payments/some-id/receipt"
            );

            expect(res.status).toBe(403);
        });

        it("should successfully return a payment receipt", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            await prisma.payment.update({
                where: { id: result.payment.id },
                data: { paymentPath: "receipts/test-receipt.png" },
            });

            const createSignedUrl = vi.fn().mockResolvedValue({
                data: {
                    signedUrl: "https://example.com/signed-receipt-url",
                },
                error: null,
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                createSignedUrl,
            } as any);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/payments/${result.payment.id}/receipt`
            );

            expect(res.status).toBe(200);
            expect(res.body.receipt).toBeDefined();
        });

        it("should return 400 for an invalid payment ID", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments/invalid-id/receipt"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if the receipt does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/payments/00000000-0000-4000-8000-000000000001/receipt"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("PATCH api/admin/payments/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .patch("/api/admin/payments/some-id")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member
                .patch("/api/admin/payments/some-id")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(403);
        });

        it("should successfully change the payment status", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/payments/${result.payment.id}`)
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(200);
            expect(res.body.payment.status).toBe("COMPLETED");

            const updated = await prisma.payment.findUnique({
                where: { id: result.payment.id },
            });

            expect(updated?.status).toBe("COMPLETED");
        });

        it("should return 400 for an invalid payment ID", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/payments/invalid-id")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid payment status", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/payments/${result.payment.id}`)
                .send({ status: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the status is missing", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin
                .patch(`/api/admin/payments/${result.payment.id}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin
                .patch("/api/admin/payments/00000000-0000-4000-8000-000000000001")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE api/admin/payments/:id", () => {

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app)
                .delete("/api/admin/payments/some-id");

            expect(res.status).toBe(401);
        });

        it("should return 403 if the user is not an admin", async () => {
            const member = await userRequest();

            const res = await member.delete("/api/admin/payments/some-id");

            expect(res.status).toBe(403);
        });

        it("should successfully delete a payment", async () => {
            const member = await createMember();
            const result = await createSubscriptionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.delete(
                `/api/admin/payments/${result.payment.id}`
            );

            expect(res.status).toBe(200);

            const deleted = await prisma.payment.findUnique({
                where: { id: result.payment.id },
            });

            expect(deleted).toBeNull();
        });

        it("should return 400 for an invalid payment ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/payments/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/payments/00000000-0000-4000-8000-000000000001"
            );

            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/admin/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/admin/sessions");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/admin/sessions");

            expect(res.status).toBe(403);
        });

        it("should successfully return sessions", async () => {
            const member = await createMember();
            await createSessionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.get("/api/admin/sessions");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.session)).toBe(true);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by userId", async () => {
            const member1 = await createMember();

            await createSessionFixture(member1.id);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/sessions?userId=${member1.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toBeDefined();
            expect(res.body.session[0].userId).toBe(member1.id);
        });

        it("should filter sessions by facility", async () => {
            const member = await createMember();

            await createSessionFixture(member.id, { facility: "GYM" });

            const admin = await adminRequest();

            const res = await admin.get("/api/admin/sessions?facility=GYM");

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkInAfter", async () => {
            const member = await createMember();

            await createSessionFixture(member.id, {
                checkIn: new Date("2026-01-01T10:00:00Z"),
            });

            await createSessionFixture(member.id, {
                checkIn: new Date("2026-02-01T10:00:00Z"),
            });

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?checkInAfter=2026-01-15T00:00:00Z"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkInBefore", async () => {
            const member = await createMember();

            await createSessionFixture(member.id, {
                checkIn: new Date("2026-01-01T10:00:00Z"),
            });

            await createSessionFixture(member.id, {
                checkIn: new Date("2026-02-01T10:00:00Z"),
            });

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?checkInBefore=2026-01-15T00:00:00Z"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkOutAfter", async () => {
            const member = await createMember();

            await createSessionFixture(member.id, {
                checkOut: new Date("2026-01-10T10:00:00Z"),
            });

            await createSessionFixture(member.id, {
                checkOut: new Date("2026-02-10T10:00:00Z"),
            });

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?checkOutAfter=2026-01-20T00:00:00Z"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkOutBefore", async () => {
            const member = await createMember();

            await createSessionFixture(member.id, {
                checkOut: new Date("2026-01-10T10:00:00Z"),
            });

            await createSessionFixture(member.id, {
                checkOut: new Date("2026-02-10T10:00:00Z"),
            });

            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?checkOutBefore=2026-01-20T00:00:00Z"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should combine multiple query filters", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            await createSessionFixture(member1.id, {
                facility: "GYM",
                checkIn: new Date("2026-01-10T10:00:00Z"),
            });

            await createSessionFixture(member1.id, {
                facility: "FOOTBALL",
                checkIn: new Date("2026-01-10T10:00:00Z"),
            });

            await createSessionFixture(member2.id, {
                facility: "GYM",
                checkIn: new Date("2026-01-10T10:00:00Z"),
            });

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/sessions?userId=${member1.id}&facility=GYM&checkInAfter=2026-01-01T00:00:00Z`
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toBeDefined();
            expect(res.body.session[0].userId).toBe(member1.id);
        });

        it("should reject an invalid userId", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?userId=invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should reject an invalid facility", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?facility=INVALID"
            );

            expect(res.status).toBe(400);
        });

        it("should reject invalid date", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions?checkInAfter=invalid-date"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 when no sessions are found", async () => {
            const admin = await adminRequest();

            const res = await admin.get("/api/admin/sessions");

            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/admin/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const member = await createMember();
            const session = await createSessionFixture(member.id);
            const user = await userRequest();

            const res = await user.get(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(403);
        });

        it("should successfully return a session", async () => {
            const member = await createMember();
            const session = await createSessionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
        });

        it("should reject an invalid session ID", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                "/api/admin/sessions/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.get(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/admin/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .post("/api/admin/sessions")
                .send({
                    userId: crypto.randomUUID(),
                    facility: "GYM",
                });

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const member = await createMember();
            const user = await userRequest();

            const res = await user
                .post("/api/admin/sessions")
                .send({
                    userId: member.id,
                    facility: "GYM",
                });

            expect(res.status).toBe(403);
        });

        it("should successfully create a session", async () => {
            const member = await createMember();
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    userId: member.id,
                    facility: "GYM",
                });

            expect(res.status).toBe(201);
            expect(res.body.session.userId).toBe(member.id);
            expect(res.body.session.checkIn).toBeDefined();
            expect(res.body.session.checkOut).toBeNull();

            const savedSession = await prisma.facilitySession.findUnique({
                where: { id: res.body.session.id },
            });

            expect(savedSession).not.toBeNull();
        });

        it("should reject an invalid userId", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    userId: "invalid-id",
                    facility: "GYM",
                });

            expect(res.status).toBe(400);
        });

        it("should reject an invalid facility", async () => {
            const member = await createMember();
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    userId: member.id,
                    facility: "INVALID",
                });

            expect(res.status).toBe(400);
        });

        it("should reject a request without userId", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    facility: "GYM",
                });

            expect(res.status).toBe(400);
        });

        it("should reject a request without facility", async () => {
            const member = await createMember();
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    userId: member.id,
                });

            expect(res.status).toBe(400);
        });

        it("should return a 500 if it couldn't create a session", async () => {
            const admin = await adminRequest();

            const res = await admin
                .post("/api/admin/sessions")
                .send({
                    userId: crypto.randomUUID(),
                    facility: "GYM",
                });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/admin/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).patch(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const member = await createMember();
            const session = await createSessionFixture(member.id);
            const user = await userRequest();

            const res = await user.patch(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(403);
        });

        it("should successfully checkout a session", async () => {
            const member = await createMember();
            const session = await createSessionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.patch(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
            expect(res.body.session.checkOut).not.toBeNull();

            const updatedSession = await prisma.facilitySession.findUnique({
                where: { id: session.id },
            });

            expect(updatedSession?.checkOut).not.toBeNull();
        });

        it("should reject an invalid session ID", async () => {
            const admin = await adminRequest();

            const res = await admin.patch(
                "/api/admin/sessions/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const admin = await adminRequest();

            const res = await admin.patch(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(404);
        });

        it("should return 404 when the session is already checked out", async () => {
            const member = await createMember();

            const session = await createSessionFixture(member.id, {
                checkOut: new Date(),
            });

            const admin = await adminRequest();

            const res = await admin.patch(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/admin/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).delete(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.delete(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(403);
        });

        it("should successfully delete a session", async () => {
            const member = await createMember();
            const session = await createSessionFixture(member.id);

            const admin = await adminRequest();

            const res = await admin.delete(
                `/api/admin/sessions/${session.id}`
            );

            expect(res.status).toBe(200);

            const deletedSession = await prisma.facilitySession.findUnique({
                where: { id: session.id },
            });

            expect(deletedSession).toBeNull();
        });

        it("should reject an invalid session ID", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                "/api/admin/sessions/invalid-id"
            );

            expect(res.status).toBe(400);
        });

        it("should return 500 when the session doesn't exist", async () => {
            const admin = await adminRequest();

            const res = await admin.delete(
                `/api/admin/sessions/${crypto.randomUUID()}`
            );

            // Depends on your Prisma error middleware.
            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/admin/logout-all", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).post("/api/admin/logout-all");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.post("/api/admin/logout-all");

            expect(res.status).toBe(403);
        });

        it("should successfully revoke all active sessions", async () => {
            const member1 = await createMember();
            const member2 = await createMember();

            const session1 = await prisma.authSession.create({
                data: {
                    userId: member1.id,
                    currentRefreshDigest: "digest-1",
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                },
            });

            const session2 = await prisma.authSession.create({
                data: {
                    userId: member2.id,
                    currentRefreshDigest: "digest-2",
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                },
            });

            const admin = await adminRequest();

            const res = await admin.post("/api/admin/logout-all");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Logged Out All Devices!");

            const sessions = await prisma.authSession.findMany({
                where: {
                    id: { in: [session1.id, session2.id] },
                },
            });

            expect(sessions).toHaveLength(2);
            expect(sessions.every(session => session.revokedAt !== null)).toBe(true);
        });

        it("should preserve already revoked sessions", async () => {
            const member = await createMember();

            const revokedAt = new Date("2026-01-01T10:00:00Z");

            const session = await prisma.authSession.create({
                data: {
                    userId: member.id,
                    currentRefreshDigest: "revoked-digest",
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                    revokedAt,
                },
            });

            const admin = await adminRequest();

            const res = await admin.post("/api/admin/logout-all");

            expect(res.status).toBe(200);

            const updatedSession = await prisma.authSession.findUnique({
                where: { id: session.id },
            });

            expect(updatedSession?.revokedAt?.getTime()).toBe(revokedAt.getTime());
        });

        it("should return 500 when the service fails", async () => {
            vi.spyOn(sessionServices, "logOutAll").mockRejectedValue(
                new Error("Database error")
            );

            const admin = await adminRequest();

            const res = await admin.post("/api/admin/logout-all");

            expect(res.status).toBe(500);
        });
    });
});