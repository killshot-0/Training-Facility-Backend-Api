import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed, createPaymentFixture } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';
import { supabase } from '../src/lib/storage.js';



describe("Payment Tests", () => {
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

    describe("GET /api/payments", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/payments");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user.get("/api/payments");

            expect(res.status).toBe(403);
        });

        it("should return 404 when no payments exist", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/payments");

            expect(res.status).toBe(404);
        });

        it("should return all payments", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id);
            await createPaymentFixture(member.id, {
                planName: "PREMIUM"
            });

            const user = await getAdminRequest();

            const res = await user.get("/api/payments");

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(2);
        });

        it("should filter payments by userId", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ userId: member.id });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].userId).toBe(member.id);
        });

        it("should filter payments by plan", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id, {
                planName: "BASIC"
            });

            await createPaymentFixture(member.id, {
                planName: "PREMIUM"
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ plan: "BASIC" });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should filter payments by status", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id, {
                status: "PENDING"
            });

            await createPaymentFixture(member.id, {
                status: "COMPLETED"
            });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ status: "PENDING" });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].status).toBe("PENDING");
        });

        it("should filter payments by minAmount", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 3000 });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ minAmount: 2000 });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should filter payments by maxAmount", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 3000 });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ maxAmount: 2000 });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should filter payments by minAmount and maxAmount", async () => {
            const member = await createAnotherMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 2000 });
            await createPaymentFixture(member.id, { amount: 3000 });

            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({
                    minAmount: 1500,
                    maxAmount: 2500
                });

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should return 400 for an invalid userId", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ userId: "invalid-id" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid plan", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ plan: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid status", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ status: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative minAmount", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ minAmount: -100 });

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative maxAmount", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ maxAmount: -100 });

            expect(res.status).toBe(400);
        });

        it("should return 400 for a nonnumeric minAmount", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ minAmount: "invalid" });

            expect(res.status).toBe(400);
        });

        it("should return 400 for a nonnumeric maxAmount", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments")
                .query({ maxAmount: "invalid" });

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving payments fails", async () => {
            const user = await getAdminRequest();

            vi.spyOn(prisma.payment, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get("/api/payments");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/payments/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .get("/api/payments/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/payments/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await getAdminRequest();

            const res = await user.get("/api/payments/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the payment does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(404);
        });

        it("should return the requested payment", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user.get(`/api/payments/${payment.id}`);

            expect(res.status).toBe(200);
            expect(res.body.payment.id).toBe(payment.id);
        });

        it("should return 500 when retrieving a payment fails", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.payment, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user.get(`/api/payments/${payment.id}`);

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/payments/:id/receipt", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .get("/api/payments/00000000-0000-4000-8000-000000000001/receipt");

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/payments/00000000-0000-4000-8000-000000000001/receipt");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments/invalid-id/receipt");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the payment does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .get("/api/payments/00000000-0000-4000-8000-000000000001/receipt");

            expect(res.status).toBe(404);
        });

        it("should return 404 when the payment has no receipt path", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .get(`/api/payments/${payment.id}/receipt`);

            expect(res.status).toBe(404);
        });

        it("should return the signed receipt URL", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id, {
                paymentPath: "receipts/test-receipt.pdf"
            });

            const user = await getAdminRequest();

            const createSignedUrl = vi.fn().mockResolvedValue({
                data: {
                    signedUrl: "https://example.com/receipt.pdf"
                },
                error: null
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                createSignedUrl
            } as any);

            const res = await user
                .get(`/api/payments/${payment.id}/receipt`);

            expect(res.status).toBe(200);
            expect(res.body.receipt).toBe("https://example.com/receipt.pdf");
            expect(createSignedUrl).toHaveBeenCalledWith(
                "receipts/test-receipt.pdf",
                300
            );
        });

        it("should return 500 when retrieving the receipt record fails", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.payment, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .get(`/api/payments/${payment.id}/receipt`);

            expect(res.status).toBe(500);
        });

        it("should return 500 when generating the signed receipt URL fails", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id, {
                paymentPath: "receipts/test-receipt.pdf"
            });

            const user = await getAdminRequest();

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                createSignedUrl: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Storage failure" }
                })
            } as any);

            const res = await user
                .get(`/api/payments/${payment.id}/receipt`);

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/payments/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/payments/00000000-0000-4000-8000-000000000001")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(401);
        });

        it("should reject members without permission", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/payments/00000000-0000-4000-8000-000000000001")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/payments/invalid-id")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(400);
        });

        it("should return 400 when status is missing", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/payments/00000000-0000-4000-8000-000000000001")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid payment status", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/payments/00000000-0000-4000-8000-000000000001")
                .send({ status: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should return 404 when the payment does not exist", async () => {
            const user = await getAdminRequest();

            const res = await user
                .patch("/api/payments/00000000-0000-4000-8000-000000000001")
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(404);
        });

        it("should successfully change a pending payment to COMPLETED", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(200);
            expect(res.body.payment.id).toBe(payment.id);
            expect(res.body.payment.status).toBe("COMPLETED");
        });

        it("should successfully change a pending payment to CANCELLED", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(200);
            expect(res.body.payment.status).toBe("CANCELLED");
        });

        it("should return 404 when changing a payment to its existing status", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "PENDING" });

            expect(res.status).toBe(404);
        });

        it("should return 404 when changing a payment that is already completed", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id, {
                status: "COMPLETED"
            });

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "CANCELLED" });

            expect(res.status).toBe(404);
        });

        it("should return 404 when changing a payment that is already cancelled", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id, {
                status: "CANCELLED"
            });

            const user = await getAdminRequest();

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(404);
        });

        it("should return 500 when retrieving the payment for status change fails", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.payment, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(500);
        });

        it("should return 500 when updating the payment status fails", async () => {
            const member = await createAnotherMember();
            const payment = await createPaymentFixture(member.id);

            const user = await getAdminRequest();

            vi.spyOn(prisma.payment, "update")
                .mockRejectedValueOnce(new Error("Database failure"));

            const res = await user
                .patch(`/api/payments/${payment.id}`)
                .send({ status: "COMPLETED" });

            expect(res.status).toBe(500);
        });
    });
});