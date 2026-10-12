import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';
import { createSubscriptionFixture, createSessionFixture, createPaymentFixture } from './helpers/factory.js';
import { supabase } from '../src/lib/storage.js';



describe("User Tests", () => {
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
    async function getCurrentMember() {
        return prisma.user.findUniqueOrThrow({
            where: { email: validUser.email }
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


    describe("GET /api/users/me", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/users/me");

            expect(res.status).toBe(401);
        });

        it("should retrieve the current user's information", async () => {
            const user = await userRequest();
            const res = await user.get("/api/users/me");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("User Fetched Successfully!");
            expect(res.body.user).toMatchObject({
                id: expect.any(String),
                email: expect.any(String),
                role: { name: "MEMBER" },
            });

            expect(res.body.user).toHaveProperty("createdAt");
            expect(res.body.user).toHaveProperty("avatarUrl");
            expect(res.body.user).not.toHaveProperty("passwordHash");
        });

        it("should return 500 when the service fails", async () => {
            vi.spyOn(prisma.user, "findUnique").mockRejectedValue(
                new Error("Database error")
            );

            const user = await userRequest();
            const res = await user.get("/api/users/me");

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/me", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/users/me")
                .send({ name: "Updated Name" });

            expect(res.status).toBe(401);
        });

        it("should update the user's name", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ name: "Updated Name" });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Updated Successfully!");
        });

        it("should update the user's email", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ email: "Updated@example.com" });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe("updated@example.com");
        });

        it("should update the user's password", async () => {
            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            const oldPasswordHash = currentUser.passwordHash;

            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ password: "NewSecurePassword123!" });

            expect(res.status).toBe(200);

            const updatedUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                select: { passwordHash: true },
            });

            expect(updatedUser?.passwordHash).not.toBe(oldPasswordHash);
            expect(res.body.user).not.toHaveProperty("passwordHash");
        });

        it("should update multiple user fields together", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({
                    name: "New Name",
                    email: "newemail@example.com",
                    password: "NewSecurePassword123!",
                });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe("newemail@example.com");
        });

        it("should allow an empty update body", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({});

            expect(res.status).toBe(200);
        });

        it("should reject an empty name", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ name: "   " });

            expect(res.status).toBe(400);
        });

        it("should reject an invalid email", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ email: "invalid-email" });

            expect(res.status).toBe(400);
        });

        it("should reject a password shorter than 12 characters", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ password: "short123" });

            expect(res.status).toBe(400);
        });

        it("should return 500 when updating the user fails", async () => {
            vi.spyOn(prisma.user, "update").mockRejectedValue(
                new Error("Database error")
            );

            const user = await userRequest();
            const res = await user
                .patch("/api/users/me")
                .send({ name: "Updated Name" });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/me/avatar", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/users/me/avatar")
                .attach("avatar", Buffer.from("fake image"), {
                    filename: "avatar.png",
                    contentType: "image/png",
                });

            expect(res.status).toBe(401);
        });

        it("should upload an avatar successfully", async () => {
            const upload = vi.fn().mockResolvedValue({
                data: { path: "avatars/test-avatar.png" },
                error: null,
            });

            const getPublicUrl = vi.fn().mockReturnValue({
                data: { publicUrl: "https://example.com/avatar.png" },
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                upload,
                getPublicUrl,
                remove: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            } as any);

            const user = await userRequest();
            const res = await user
                .patch("/api/users/me/avatar")
                .attach("avatar", Buffer.from("fake image"), {
                    filename: "avatar.png",
                    contentType: "image/png",
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Avatar uploaded Successfully!");
            expect(upload).toHaveBeenCalledOnce();
            expect(getPublicUrl).toHaveBeenCalledWith(
                "avatars/test-avatar.png"
            );

            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            expect(currentUser.avatarUrl).toBe("https://example.com/avatar.png");
        });

        it("should reject a request without an avatar file", async () => {
            const user = await userRequest();
            const res = await user.patch("/api/users/me/avatar");

            expect(res.status).toBe(400);
        });

        it("should reject an unsupported file type", async () => {
            const user = await userRequest();
            const res = await user
                .patch("/api/users/me/avatar")
                .attach("avatar", Buffer.from("not an image"), {
                    filename: "avatar.txt",
                    contentType: "text/plain",
                });

            expect(res.status).toBe(400);
        });

        it("should return 500 when cloud storage upload fails", async () => {
            vi.spyOn(supabase.storage, "from").mockReturnValue({
                upload: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Storage error" },
                }),
                getPublicUrl: vi.fn(),
                remove: vi.fn(),
            } as any);

            const user = await userRequest();
            const res = await user
                .patch("/api/users/me/avatar")
                .attach("avatar", Buffer.from("fake image"), {
                    filename: "avatar.png",
                    contentType: "image/png",
                });

            expect(res.status).toBe(500);
        });

        it("should return 500 when updating the avatar in the database fails", async () => {
            vi.spyOn(supabase.storage, "from").mockReturnValue({
                upload: vi.fn().mockResolvedValue({
                    data: { path: "avatars/test-avatar.png" },
                    error: null,
                }),
                getPublicUrl: vi.fn().mockReturnValue({
                    data: { publicUrl: "https://example.com/avatar.png" },
                }),
                remove: vi.fn(),
            } as any);

            vi.spyOn(prisma.user, "update").mockRejectedValue(
                new Error("Database error")
            );

            const user = await userRequest();
            const res = await user
                .patch("/api/users/me/avatar")
                .attach("avatar", Buffer.from("fake image"), {
                    filename: "avatar.png",
                    contentType: "image/png",
                });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/me/remove-avatar", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/users/me/remove-avatar");

            expect(res.status).toBe(401);
        });

        it("should remove the user's avatar successfully", async () => {
            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    avatarUrl: "https://example.com/avatar.png",
                    avatarPath: "avatars/test-avatar.png",
                },
            });

            const remove = vi.fn().mockResolvedValue({
                data: [],
                error: null,
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                remove,
            } as any);

            const user = await userRequest();
            const res = await user.patch("/api/users/me/remove-avatar");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Avatar deleted successfully!");
            expect(remove).toHaveBeenCalledWith([
                "avatars/test-avatar.png",
            ]);

            const updatedUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
            });

            expect(updatedUser?.avatarUrl).toBeNull();
            expect(updatedUser?.avatarPath).toBeNull();
        });

        it("should return 404 when the user has no avatar", async () => {
            const user = await userRequest();
            const res = await user.patch("/api/users/me/remove-avatar");

            expect(res.status).toBe(404);
        });

        it("should return 500 when cloud storage removal fails", async () => {
            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    avatarUrl: "https://example.com/avatar.png",
                    avatarPath: "avatars/test-avatar.png",
                },
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                remove: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Storage error" },
                }),
            } as any);

            const user = await userRequest();
            const res = await user.patch("/api/users/me/remove-avatar");

            expect(res.status).toBe(500);
        });

        it("should return 500 when updating the user after removal fails", async () => {
            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    avatarUrl: "https://example.com/avatar.png",
                    avatarPath: "avatars/test-avatar.png",
                },
            });

            vi.spyOn(supabase.storage, "from").mockReturnValue({
                remove: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            } as any);

            vi.spyOn(prisma.user, "update").mockRejectedValue(
                new Error("Database error")
            );

            const user = await userRequest();
            const res = await user.patch("/api/users/me/remove-avatar");

            expect(res.status).toBe(500);
        });
    });

    describe("DELETE /api/users/me", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).delete("/api/users/me");

            expect(res.status).toBe(401);
        });

        it("should delete the current user's account", async () => {
            const currentUser = await prisma.user.findFirstOrThrow({
                where: { role: { name: "MEMBER" } },
            });

            const user = await userRequest();
            const res = await user.delete("/api/users/me");

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Deleted Successfully!");

            const deletedUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
            });

            expect(deletedUser).toBeNull();
        });

        it("should return 500 when deleting the user fails", async () => {
            vi.spyOn(prisma.user, "delete").mockRejectedValue(
                new Error("Database error")
            );

            const user = await userRequest();
            const res = await user.delete("/api/users/me");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/users/subscriptions", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app).get("/api/users/subscriptions");

            expect(res.status).toBe(401);
        });

        it("should return 404 if the user has no subscriptions", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("No Subscriptions Found!");
        });

        it("should return all subscriptions belonging to the current user", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            await createSubscriptionFixture(currentUser.id);
            await createSubscriptionFixture(currentUser.id, {
                membership: "QUARTERLY"
            });

            const res = await user
                .get("/api/users/subscriptions")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(2);
        });

        it("should filter subscriptions by membership", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            await createSubscriptionFixture(currentUser.id, {
                membership: "MONTHLY"
            });

            await createSubscriptionFixture(currentUser.id, {
                membership: "QUARTERLY"
            });

            const res = await user
                .get("/api/users/subscriptions")
                .query({ membership: "MONTHLY" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].membership).toBe("MONTHLY");
        });

        it("should filter subscriptions by status", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            await createSubscriptionFixture(currentUser.id, {
                status: "ACTIVE"
            });

            await createSubscriptionFixture(currentUser.id, {
                status: "CANCELLED"
            });

            const res = await user
                .get("/api/users/subscriptions")
                .query({ status: "CANCELLED" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
            expect(res.body.subscription[0].status).toBe("CANCELLED");
        });

        it("should filter subscriptions by plan", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            await createSubscriptionFixture(currentUser.id, {
                plan: "BASIC"
            });

            await createSubscriptionFixture(currentUser.id, {
                plan: "PREMIUM"
            });

            const res = await user
                .get("/api/users/subscriptions")
                .query({ plan: "PREMIUM" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription).toHaveLength(1);
        });

        it("should return 400 for an invalid membership filter", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions")
                .query({ membership: "WEEKLY" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid status filter", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions")
                .query({ status: "UNKNOWN" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid plan filter", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions")
                .query({ plan: "GOLD" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 500 if fetching subscriptions fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma.subscription, "findMany")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .get("/api/users/subscriptions")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });    

    describe("GET /api/users/subscriptions/:id", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .get("/api/users/subscriptions/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid subscription ID", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions/invalid-id")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 404 if the subscription does not exist", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/subscriptions/00000000-0000-4000-8000-000000000001")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return a subscription belonging to the current user", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            const {subscription} = await createSubscriptionFixture(currentUser.id);

            const res = await user
                .get(`/api/users/subscriptions/${subscription.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription.id).toBe(subscription.id);
        });

        it("should return 403 if the subscription belongs to another user", async () => {
            const user = await userRequest();

            const anotherMember = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(anotherMember.id);

            const res = await user
                .get(`/api/users/subscriptions/${subscription.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it("should return 500 if checking subscription ownership fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma.subscription, "findUnique")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .get("/api/users/subscriptions/00000000-0000-4000-8000-000000000001")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/users/subscription", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .post("/api/users/subscription")
                .send({
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(401);
        });

        it("should create a subscription and its payment successfully", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(201);
            expect(res.body.subscription).toBeDefined();
            expect(res.body.payment).toBeDefined();

            expect(res.body.subscription.status).toBe("ACTIVE");
            expect(res.body.subscription.membership).toBe("MONTHLY");

            expect(res.body.payment.status).toBe("PENDING");
            expect(res.body.payment.subscriptionId).toBe(
                res.body.subscription.id
            );

            const payment = await prisma.payment.findUnique({
                where: { id: res.body.payment.id }
            });

            expect(payment).not.toBeNull();
        });

        it("should return 400 if the plan is missing", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership is missing", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    plan: "BASIC"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the plan is invalid", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    plan: "GOLD",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 if the membership is invalid", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    plan: "BASIC",
                    membership: "WEEKLY"
                });

            expect(res.status).toBe(400);
        });

        it("should return 500 if subscription creation fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma, "$transaction")
                .mockRejectedValue(new Error("Transaction failed"));

            const res = await user
                .post("/api/users/subscription")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    plan: "BASIC",
                    membership: "MONTHLY"
                });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/subscription/:id/status", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .patch("/api/users/subscription/00000000-0000-4000-8000-000000000001/status");

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid subscription ID", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/subscription/invalid-id/status")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 404 if the subscription does not exist", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/subscription/00000000-0000-4000-8000-000000000001/status")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return 403 if the subscription belongs to another user", async () => {
            const user = await userRequest();

            const anotherMember = await createAnotherMember();
            const {subscription} = await createSubscriptionFixture(anotherMember.id);

            const res = await user
                .patch(`/api/users/subscription/${subscription.id}/status`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it("should cancel the current user's subscription", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            const {subscription} = await createSubscriptionFixture(currentUser.id);

            const res = await user
                .patch(`/api/users/subscription/${subscription.id}/status`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.subscription.id).toBe(subscription.id);
            expect(res.body.subscription.status).toBe("CANCELLED");

            const updatedSubscription = await prisma.subscription.findUnique({
                where: { id: subscription.id }
            });

            expect(updatedSubscription?.status).toBe("CANCELLED");
        });

        it("should return 500 if updating the subscription fails", async () => {
            const user = await userRequest();

            const currentUser = await prisma.user.findUniqueOrThrow({
                where: { email: validUser.email }
            });

            const {subscription} = await createSubscriptionFixture(currentUser.id);

            vi.spyOn(prisma.subscription, "update")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .patch(`/api/users/subscription/${subscription.id}/status`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/users/payments", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app).get("/api/users/payments");

            expect(res.status).toBe(401);
        });

        it("should return 404 if the user has no payments", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Unabele to Find Payment!");
        });

        it("should return all payments belonging to the current user", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id);
            await createPaymentFixture(member.id, { amount: 5400 });

            const res = await user
                .get("/api/users/payments")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(2);
        });

        it("should filter payments by status", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id, { status: "PENDING" });
            await createPaymentFixture(member.id, { status: "COMPLETED" });

            const res = await user
                .get("/api/users/payments")
                .query({ status: "COMPLETED" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(res.body.payment[0].status).toBe("COMPLETED");
        });

        it("should filter payments by plan", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id, { planName: "BASIC" });
            await createPaymentFixture(member.id, { planName: "PREMIUM" });

            const res = await user
                .get("/api/users/payments")
                .query({ plan: "PREMIUM" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
        });

        it("should filter payments by minimum amount", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 3000 });

            const res = await user
                .get("/api/users/payments")
                .query({ minAmount: 2000 })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(Number(res.body.payment[0].amount)).toBe(3000);
        });

        it("should filter payments by maximum amount", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 3000 });

            const res = await user
                .get("/api/users/payments")
                .query({ maxAmount: 2000 })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(Number(res.body.payment[0].amount)).toBe(1000);
        });

        it("should filter payments by minimum and maximum amount", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            await createPaymentFixture(member.id, { amount: 1000 });
            await createPaymentFixture(member.id, { amount: 2500 });
            await createPaymentFixture(member.id, { amount: 4000 });

            const res = await user
                .get("/api/users/payments")
                .query({ minAmount: 2000, maxAmount: 3000 })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment).toHaveLength(1);
            expect(Number(res.body.payment[0].amount)).toBe(2500);
        });

        it("should return 400 for an invalid status", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .query({ status: "UNKNOWN" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid plan", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .query({ plan: "GOLD" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative minimum amount", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .query({ minAmount: -100 })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for a negative maximum amount", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .query({ maxAmount: -100 })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 for a non-numeric minimum amount", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments")
                .query({ minAmount: "abc" })
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 500 if fetching payments fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma.payment, "findMany")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .get("/api/users/payments")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/users/payments/:id", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .get("/api/users/payments/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments/invalid-id")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const user = await userRequest();

            const res = await user
                .get("/api/users/payments/00000000-0000-4000-8000-000000000001")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return a payment belonging to the current user", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            const res = await user
                .get(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment.id).toBe(payment.id);
        });

        it("should return 403 if the payment belongs to another user", async () => {
            const user = await userRequest();
            const anotherMember = await createAnotherMember();

            const payment = await createPaymentFixture(anotherMember.id);

            const res = await user
                .get(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it("should return 500 if checking payment ownership fails", async () => {
            const user = await userRequest();

            vi.spyOn(prisma.payment, "findUnique")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .get("/api/users/payments/00000000-0000-4000-8000-000000000001")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/payments/:id", () => {
        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .patch("/api/users/payments/00000000-0000-4000-8000-000000000001");

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/payments/invalid-id")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/payments/00000000-0000-4000-8000-000000000001")
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return 403 if the payment belongs to another user", async () => {
            const user = await userRequest();
            const anotherMember = await createAnotherMember();

            const payment = await createPaymentFixture(anotherMember.id);

            const res = await user
                .patch(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it("should cancel a pending payment", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                status: "PENDING"
            });

            const res = await user
                .patch(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.payment.id).toBe(payment.id);
            expect(res.body.payment.status).toBe("CANCELLED");

            const updatedPayment = await prisma.payment.findUnique({
                where: { id: payment.id }
            });

            expect(updatedPayment?.status).toBe("CANCELLED");
        });

        it("should return 404 if the payment is already completed", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                status: "COMPLETED"
            });

            const res = await user
                .patch(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return 404 if the payment is already cancelled", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                status: "CANCELLED"
            });

            const res = await user
                .patch(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });

        it("should return 500 if updating the payment fails", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            vi.spyOn(prisma.payment, "update")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .patch(`/api/users/payments/${payment.id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/payment/:id/upload", () => {
        const mockUpload = vi.fn();
        const mockGetPublicUrl = vi.fn();
        const mockRemove = vi.fn();

        function mockSupabaseStorage() {
            vi.spyOn(supabase.storage, "from").mockReturnValue({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
                remove: mockRemove
            } as any);
        }

        beforeEach(() => {
            mockUpload.mockReset();
            mockGetPublicUrl.mockReset();
            mockRemove.mockReset();

            mockUpload.mockResolvedValue({
                data: { path: "payments/test-receipt.png" },
                error: null
            });

            mockGetPublicUrl.mockReturnValue({
                data: {
                    publicUrl: "https://example.com/payments/test-receipt.png"
                }
            });

            mockRemove.mockResolvedValue({
                data: [],
                error: null
            });
        });

        it("should return 401 if the user is not authenticated", async () => {
            const res = await request(app)
                .patch("/api/users/payment/00000000-0000-4000-8000-000000000001/upload");

            expect(res.status).toBe(401);
        });

        it("should return 400 for an invalid payment ID", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/payment/invalid-id/upload")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(400);
        });

        it("should return 404 if the payment does not exist", async () => {
            const user = await userRequest();

            const res = await user
                .patch("/api/users/payment/00000000-0000-4000-8000-000000000001/upload")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(404);
        });

        it("should return 403 if the payment belongs to another user", async () => {
            const user = await userRequest();
            const anotherMember = await createAnotherMember();

            const payment = await createPaymentFixture(anotherMember.id);

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(403);
        });

        it("should return 400 if no receipt file is provided", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(400);
        });

        it("should return 400 if the uploaded file has an invalid MIME type", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("not an image"), {
                    filename: "receipt.txt",
                    contentType: "text/plain"
                });

            expect(res.status).toBe(400);
        });

        it("should upload a receipt successfully", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            mockSupabaseStorage();

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Payment uploaded successfully!");
            expect(res.body.payment.id).toBe(payment.id);

            expect(mockUpload).toHaveBeenCalledOnce();
            expect(mockGetPublicUrl).toHaveBeenCalledOnce();

            const updatedPayment = await prisma.payment.findUnique({
                where: { id: payment.id }
            });

            expect(updatedPayment?.paymentPath).toBe("payments/test-receipt.png");
            expect(updatedPayment?.paymentUrl).toBe(
                "https://example.com/payments/test-receipt.png"
            );
        });

        it("should replace an existing receipt", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                paymentPath: "payments/old-receipt.png",
                paymentUrl: "https://example.com/payments/old-receipt.png"
            });

            mockSupabaseStorage();

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("new image"), {
                    filename: "new-receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(200);
            expect(mockRemove).toHaveBeenCalledWith([
                "payments/old-receipt.png"
            ]);
        });

        it("should return 404 if the payment is already completed", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                status: "COMPLETED"
            });

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(404);
        });

        it("should return 404 if the payment is cancelled", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id, {
                status: "CANCELLED"
            });

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(404);
        });

        it("should return 500 if Supabase upload fails", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            mockUpload.mockResolvedValue({
                data: null,
                error: { message: "Storage unavailable" }
            });

            mockSupabaseStorage();

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(500);
        });

        it("should return 500 if updating the payment after upload fails", async () => {
            const user = await userRequest();
            const member = await getCurrentMember();

            const payment = await createPaymentFixture(member.id);

            mockSupabaseStorage();

            vi.spyOn(prisma.payment, "update")
                .mockRejectedValue(new Error("Database failure"));

            const res = await user
                .patch(`/api/users/payment/${payment.id}/upload`)
                .set("Authorization", `Bearer ${userToken}`)
                .attach("payment", Buffer.from("test image"), {
                    filename: "receipt.png",
                    contentType: "image/png"
                });

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/users/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get("/api/users/sessions");

            expect(res.status).toBe(401);
        });

        it("should return 404 when no sessions exist", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.get("/api/users/sessions");

            expect(res.status).toBe(404);
        });

        it("should return the authenticated user's sessions", async () => {
            const member = await getCurrentMember();
            await createSessionFixture(member.id);
            const user = await userRequest();

            const res = await user.get("/api/users/sessions");

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by facility", async () => {
            const member = await getCurrentMember();

            await createSessionFixture(member.id, { facility: "GYM" });
            await createSessionFixture(member.id, { facility: "SAUNA" });

            const user = await userRequest();

            const res = await user.get("/api/users/sessions?facility=GYM");

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by check-in date range", async () => {
            const member = await getCurrentMember();

            const oldSession = await createSessionFixture(member.id);

            await prisma.facilitySession.update({
                where: { id: oldSession.id },
                data: { checkIn: new Date("2025-01-01") }
            });

            await createSessionFixture(member.id);

            const user = await userRequest();

            const res = await user.get(
                "/api/users/sessions?checkInAfter=2026-01-01"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
        });

        it("should filter sessions by check-out date range", async () => {
            const member = await getCurrentMember();

            const checkedOutSession = await createSessionFixture(member.id, {
                checkOut: new Date("2026-01-10")
            });

            await createSessionFixture(member.id);

            const user = await userRequest();

            const res = await user.get(
                "/api/users/sessions?checkOutAfter=2026-01-01"
            );

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveLength(1);
            expect(res.body.session[0].id).toBe(checkedOutSession.id);
        });

        it("should reject an invalid facility query", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.get("/api/users/sessions?facility=INVALID");

            expect(res.status).toBe(400);
        });

        it("should reject invalid date query parameters", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.get(
                "/api/users/sessions?checkInAfter=not-a-date"
            );

            expect(res.status).toBe(400);
        });

        it("should return 500 when retrieving sessions fails", async () => {
            const member = await getCurrentMember();

            vi.spyOn(prisma.facilitySession, "findMany")
                .mockRejectedValueOnce(new Error("Database failure"));

            const user = await userRequest();

            const res = await user.get("/api/users/sessions");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/users/sessions/:id", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).get(
                `/api/users/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(401);
        });

        it("should reject an invalid session ID", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.get("/api/users/sessions/invalid-id");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.get(
                `/api/users/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(404);
        });

        it("should return the authenticated user's session", async () => {
            const member = await getCurrentMember();
            const session = await createSessionFixture(member.id);
            const user = await userRequest();

            const res = await user.get(
                `/api/users/sessions/${session.id}`
            );

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
        });

        it("should reject access to another member's session", async () => {
            const anotherMember = await createAnotherMember();
            const session = await createSessionFixture(anotherMember.id);
            const user = await userRequest();

            const res = await user.get(
                `/api/users/sessions/${session.id}`
            );

            expect(res.status).toBe(403);
        });

        it("should return 500 when the ownership lookup fails", async () => {
            const member = await getCurrentMember();

            vi.spyOn(prisma.facilitySession, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const user = await userRequest();

            const res = await user.get(
                `/api/users/sessions/${crypto.randomUUID()}`
            );

            expect(res.status).toBe(500);
        });
    });

    describe("POST /api/users/sessions", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .post("/api/users/sessions")
                .send({ facility: "GYM" });

            expect(res.status).toBe(401);
        });

        it("should reject an invalid facility", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user
                .post("/api/users/sessions")
                .send({ facility: "INVALID" });

            expect(res.status).toBe(400);
        });

        it("should reject a missing facility", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user
                .post("/api/users/sessions")
                .send({});

            expect(res.status).toBe(400);
        });

        it("should create a session successfully", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user
                .post("/api/users/sessions")
                .send({ facility: "GYM" });

            expect(res.status).toBe(201);
            expect(res.body.session.userId).toBe(member.id);
            expect(res.body.session.checkIn).toBeDefined();
            expect(res.body.session.checkOut).toBeNull();
        });

        it("should return 500 when session creation fails", async () => {
            const member = await getCurrentMember();

            vi.spyOn(prisma.facilitySession, "create")
                .mockRejectedValueOnce(new Error("Database failure"));

            const user = await userRequest();

            const res = await user
                .post("/api/users/sessions")
                .send({ facility: "GYM" });

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/users/sessions/:id/checkout", () => {
        it("should reject unauthenticated requests", async () => {
            const res = await request(app).patch(
                `/api/users/sessions/${crypto.randomUUID()}/checkout`
            );

            expect(res.status).toBe(401);
        });

        it("should reject an invalid session ID", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.patch(
                "/api/users/sessions/invalid-id/checkout"
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 when the session does not exist", async () => {
            const member = await getCurrentMember();
            const user = await userRequest();

            const res = await user.patch(
                `/api/users/sessions/${crypto.randomUUID()}/checkout`
            );

            expect(res.status).toBe(404);
        });

        it("should reject checkout of another member's session", async () => {
            const anotherMember = await createAnotherMember();
            const session = await createSessionFixture(anotherMember.id);
            const user = await userRequest();

            const res = await user.patch(
                `/api/users/sessions/${session.id}/checkout`
            );

            expect(res.status).toBe(403);
        });

        it("should check out the authenticated user's session", async () => {
            const member = await getCurrentMember();
            const session = await createSessionFixture(member.id);
            const user = await userRequest();

            const res = await user.patch(
                `/api/users/sessions/${session.id}/checkout`
            );

            expect(res.status).toBe(200);
            expect(res.body.session.id).toBe(session.id);
            expect(res.body.session.checkOut).not.toBeNull();
        });

        it("should return 500 when checkout update fails", async () => {
            const member = await getCurrentMember();
            const session = await createSessionFixture(member.id);

            vi.spyOn(prisma.facilitySession, "update")
                .mockRejectedValueOnce(new Error("Database failure"));

            const user = await userRequest();

            const res = await user.patch(
                `/api/users/sessions/${session.id}/checkout`
            );

            expect(res.status).toBe(500);
        });

        it("should return 500 when the ownership lookup fails", async () => {
            const member = await getCurrentMember();

            vi.spyOn(prisma.facilitySession, "findUnique")
                .mockRejectedValueOnce(new Error("Database failure"));

            const user = await userRequest();

            const res = await user.patch(
                `/api/users/sessions/${crypto.randomUUID()}/checkout`
            );

            expect(res.status).toBe(500);
        });
    });
});