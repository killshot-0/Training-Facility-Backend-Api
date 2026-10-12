import { beforeEach, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { register, login, validLogin, validUser } from './auth.test.js';
import { askAI } from "../src/services/ai.service.js";
import type { AiResponseInput } from "../src/schemas/ai.schemas.js";


vi.mock("../src/services/ai.service.js", () => ({
    askAI: vi.fn()
}));

describe("AI Tests", () => {
    let userToken: string;

    async function userRequest() {
        const agent = request.agent(app);
        agent.set("Authorization", `Bearer ${userToken}`);

        return agent;
    }

    const validRequest = {
        subject: "Membership plans",
        message: "What facilities are included in the premium plan?"
    };

    const validAIResponse: AiResponseInput = {
        category: "plans",
        priority: "normal",
        summary: "The user is asking about premium plan facilities.",
        draftReply: "The premium plan includes the gym, shower, sauna, swimming pool, and football facilities.",
        needsHumanReview: false
    };

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

    describe("POST /api/ai/support", () => {

        it("should reject unauthenticated requests", async () => {
            const res = await request(app)
                .post("/api/ai/support")
                .send(validRequest);

            expect(res.status).toBe(401);
        });

        it("should successfully get an AI response", async () => {
            vi.mocked(askAI).mockResolvedValueOnce(validAIResponse);

            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send(validRequest);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Model responded successfully!");
            expect(res.body.result).toEqual(validAIResponse);

            expect(askAI).toHaveBeenCalledWith(validRequest);
        });

        it("should return 400 when subject is missing", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    message: validRequest.message
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when message is missing", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    subject: validRequest.subject
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when subject is shorter than 3 characters", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    subject: "AI"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when subject exceeds 160 characters", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    subject: "A".repeat(161)
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when message is shorter than 3 characters", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    message: "Hi"
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when message exceeds 2000 characters", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    message: "A".repeat(2001)
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when subject contains only whitespace", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    subject: "   "
                });

            expect(res.status).toBe(400);
        });

        it("should return 400 when message contains only whitespace", async () => {
            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send({
                    ...validRequest,
                    message: "   "
                });

            expect(res.status).toBe(400);
        });

        it("should return 500 when the AI service fails", async () => {
            vi.mocked(askAI).mockRejectedValueOnce(
                new Error("AI provider failure")
            );

            const user = await userRequest();

            const res = await user
                .post("/api/ai/support")
                .send(validRequest);

            expect(res.status).toBe(500);
        });
    });
});