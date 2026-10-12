import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed, createSessionFixture } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';


describe("Session Tests", () => {
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

    describe("GET /api/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/sessions");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/sessions");

            expect(res.status).toBe(403);
        });

        it("should return 404 when no sessions exist", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/sessions");

            expect(res.status).toBe(404);
        });

        it("should return all sessions", async () => {
            const member = await createAnotherMember();
            await createSessionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user.get("/api/sessions");

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by userId", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ userId: member.id });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
            expect(res.body.session[0].userId).toBe(member.id);
        });

        it("should filter sessions by facility", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id, { facility: "GYM" });
            await createSessionFixture(member.id, { facility: "SAUNA" });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ facility: "GYM" });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkInAfter", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id, {
                checkIn: new Date("2025-01-01T10:00:00.000Z")
            });

            await createSessionFixture(member.id, {
                checkIn: new Date("2025-02-01T10:00:00.000Z")
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkInAfter: "2025-01-15T00:00:00.000Z" });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkInBefore", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id, {
                checkIn: new Date("2025-01-01T10:00:00.000Z")
            });

            await createSessionFixture(member.id, {
                checkIn: new Date("2025-02-01T10:00:00.000Z")
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkInBefore: "2025-01-15T00:00:00.000Z" });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkOutAfter", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id, {
                checkOut: new Date("2025-01-01T10:00:00.000Z")
            });

            await createSessionFixture(member.id, {
                checkOut: new Date("2025-02-01T10:00:00.000Z")
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkOutAfter: "2025-01-15T00:00:00.000Z" });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by checkOutBefore", async () => {
            const member = await createAnotherMember();

            await createSessionFixture(member.id, {
                checkOut: new Date("2025-01-01T10:00:00.000Z")
            });

            await createSessionFixture(member.id, {
                checkOut: new Date("2025-02-01T10:00:00.000Z")
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkOutBefore: "2025-01-15T00:00:00.000Z" });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should return 400 for an invalid userId", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ userId: "invalid-id" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid facility", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ facility: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid checkInAfter date", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkInAfter: "not-a-date" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid checkInBefore date", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkInBefore: "not-a-date" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid checkOutAfter date", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkOutAfter: "not-a-date" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid checkOutBefore date", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions")
                .query({ checkOutBefore: "not-a-date" });

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving sessions fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.facilitySession, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/sessions");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .get("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid session ID", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/sessions/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(404);
        });

        it("should return the requested session", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .get(`/api/sessions/${session.id}`);

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
        });

        it("should return 500 when retrieving a session fails", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.facilitySession, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .get(`/api/sessions/${session.id}`);

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .post("/api/sessions")
                .send({ facility: "GYM" });

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/sessions")
                .send({ facility: "GYM" });

            expect(res.status).toBe(403);
        });

        it("should return 400 when facility is missing", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/sessions")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid facility", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/sessions")
                .send({ facility: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should create a session successfully", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            const res = await user
                .post("/api/sessions")
                .send({
                    userId: member.id,
                    facility: "GYM"
                });

            expect(res.status).toBe(201);
            expect(res.body.session.userId).toBe(member.id);
            expect(res.body.session.checkOut).toBeNull();
            expect(res.body.session.facilityId).toBeDefined();
        });

        it("should return 500 when creating a session for a nonexistent user", async () => {
            const user = await getAdminRequest();

            const res = await user
                .post("/api/sessions")
                .send({
                    userId: "00000000-0000-4000-8000-000000000001",
                    facility: "GYM"
                });

            expect(res.status).toBe(500);
        });

        it("should return 500 when creating a session fails", async () => {
            const member = await createAnotherMember();
            const user = await getAdminRequest();

            vi.spyOn(prisma.facilitySession, "create")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .post("/api/sessions")
                .send({
                    userId: member.id,
                    facility: "GYM"
                });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid session ID", async () => {
            const user = await getAdminRequest();

            const res = await user.patch("/api/sessions/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/sessions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(404);
        });

        it("should successfully check out a session", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/sessions/${session.id}`);

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
            expect(res.body.session.checkOut).not.toBeNull();
        });

        it("should return 404 when checking out an already checked-out session", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id, {
                checkOut: new Date()
            });

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/sessions/${session.id}`);

            expect(res.status).toBe(404);
        });

        it("should return 500 when retrieving the session for checkout fails", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.facilitySession, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/sessions/${session.id}`);

            expect(res.status).toBe(500);
        });

        it("should return 500 when updating the session checkout fails", async () => {
            const member = await createAnotherMember();
            const session = await createSessionFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.facilitySession, "update")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/sessions/${session.id}`);

            expect(res.status).toBe(500);
        });
    });
});