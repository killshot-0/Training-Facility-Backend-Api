import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';



describe("Facility Tests", () => {
    let userToken: string;

    async function userRequest() {
        const agent = request.agent(app);
        agent.set("Authorization", `Bearer ${userToken}`);

        return agent;
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

    describe("GET /api/facilities", () => {

        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/facilities");

            expect(res.status).toBe(401);
        });

        it("should return all facilities to an authenticated user", async () => {
            const user = await userRequest();

            const res = await user.get("/api/facilities");

            expect(res.status).toBe(200);
            expect(res.body.facilities).toBeInstanceOf(Array);
            expect(res.body.facilities.length).toBeGreaterThan(0);
        });

        it("should return 404 when no facilities exist", async () => {
            await prisma.facility.deleteMany();

            const user = await userRequest();

            const res = await user.get("/api/facilities");

            expect(res.status).toBe(404);
        });

        it("should return 500 when retrieving facilities fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma.facility, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/facilities");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/facilities/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get(
                "/api/facilities/00000000-0000-4000-8000-000000000001"
            );

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid facility ID", async () => {
            const user = await userRequest();

            const res = await user.get("/api/facilities/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the facility does not exist", async () => {
            const user = await userRequest();

            const res = await user.get(
                "/api/facilities/00000000-0000-4000-8000-000000000001"
            );

            expect(res.status).toBe(404);
        });

        it("should return the requested facility", async () => {
            const facility = await prisma.facility.findFirstOrThrow();
            const user = await userRequest();

            const res = await user.get(`/api/facilities/${facility.id}`);

            expect(res.status).toBe(200);
            expect(res.body.facilities.id).toBe(facility.id);
        });

        it("should return 500 when retrieving a facility fails", async () => {
            const facility = await prisma.facility.findFirstOrThrow();
            const user = await userRequest();

            vi.spyOn(prisma.facility, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get(`/api/facilities/${facility.id}`);

            expect(res.status).toBe(500);
        });
    });
});











//     // --------------------------------------------------
//     // GET /api/facilities/:id
//     // --------------------------------------------------

