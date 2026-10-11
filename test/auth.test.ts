import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import request, { cookies } from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { REFRESH_COOKIE_NAME } from "../src/utils/refresh-token.js";

const validUser = {
  name: "Hana",
  email: "hana@example.com",
  password: "one plus one equal two",
};

const validLogin = {
    email: "hana@example.com",
    password: "one plus one equal two",
}
export async function register() {
  return request(app).post("/api/auth/register").send(validUser);
};

export async function login() {
  return request(app).post("/api/auth/login").send(validLogin);
};

describe('Authentication Tests', () =>{

    beforeEach(async () => {
        await cleanDatabase();
        await seed();
    });

    afterAll(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    describe("Registration Tests", () => {
        
        it("registers a normalized user without exposing passwordHash", async () => {
            const res = await register();

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("message", "Successfully Registered!");
            expect(res.body.user).toHaveProperty("id");
            expect(res.body.user).not.toHaveProperty("passwordHash");
            expect(res.body.user.email).toBe("hana@example.com");
        });

        it("should return 409 if a user already exists", async () => {
            await register();

            const res = await register();

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty("message", "User already exists")
        });

        it("rejects an empty name input", async () => {
            const res = await request(app).post("/api/auth/register").send({name: "", email: " HANA@EXAMPLE.COM ", password: "one plus one equal two"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });

        it("rejects a password shorter than 12 characters", async () => {
            const res = await request(app).post("/api/auth/register").send({name: "Hana", email: " HANA@EXAMPLE.COM ", password: "223"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });

        it("rejects an invalid email", async () => {
            const res = await request(app).post("/api/auth/register").send({name: "Hana", email: " HANAEXAMPLE.COM ", password: "one plus one equal two"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });
        
        it("rejects requests with missing arguments", async () => {
            const res = await request(app).post("/api/auth/register").send({email: " HANA@EXAMPLE.COM ", password: "one plus one equal two"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });
    });

    describe("Login Tests", () => {
        it("logs in, returns an access token, safe user, and HttpOnly refresh cookie", async () => {
            await register();

            const res = await login();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message", "Login Successful!");
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body.user).not.toHaveProperty("passwordHash");
            expect(res.body.user).toMatchObject({
                id: expect.any(String),
                email: "hana@example.com",
                role: "MEMBER",
                createdAt: expect.any(String)
            });
            const cookies = res.headers["set-cookie"];

            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/refresh_token=/);
            expect(cookies[0]).toMatch(/HttpOnly/i);
        });

        it("should reject if the passed in user doesn't exist", async () => {
            const res = await request(app).post("/api/auth/login").send({email: "abel@gmail.com", password: "one plus one is two"});

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message", "Invalid Email or Password!");
        });

        it("should reject if the passed in user exists but registered through oauth with out a passwordHash", async () => {
            const user = await prisma.user.create({
                data: {
                    name: "abel",
                    email: "abel@gmail.com",
                    passwordHash: null,
                    role: {
                        connect: { name: "MEMBER" },
                    },
                },
            });       
            const res = await request(app).post("/api/auth/login").send({email: "abel@gmail.com", password: "one plus one is two"});

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message", "Invalid Email or Password!");
        });

        it("should reject if the password incorrect", async () => {
            await register();

            const res = await request(app).post("/api/auth/login").send({...validLogin, password: "one plus one is 2"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Invalid Email or Password!");
        });

        it("should reject if the password input is invalid", async () => {
            await register();

            const res = await request(app).post("/api/auth/login").send({...validLogin, password: ""});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });

        it("should reject if the email input is invalid", async () => {
            await register();

            const res = await request(app).post("/api/auth/login").send({...validLogin, email: "hanaexample.com"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });

        it("should reject requests with missing arguments", async () => {
            await register();

            const res = await request(app).post("/api/auth/login").send({email: "hana@example.com"});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Validation failed");
        });
    });

    describe("Refresh Tets", () => {
        it("should return 401 when credentials are missing", async () => {
            const res = await request(app).post('/api/auth/refresh');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message", "Refresh Session Required!");

            const cookieHeader = String(res.headers["set-cookie"]);

            expect(cookieHeader).toContain(`${REFRESH_COOKIE_NAME}=`);
            expect(cookieHeader).toMatch(/Expires=/i);
        });
        
        it("rotates the stored digest and revokes the session on replay", async () => {
            await register();

            const agent = request.agent(app);

            const loginResponse = await agent
            .post("/api/auth/login")
            .send(validLogin)
            .expect(200);

            const originalCookie = loginResponse.headers["set-cookie"]![0]!.split(";")[0]!;

            const credential = originalCookie.split("=")[1]!;
            const sessionId = credential.split(".")[0]!;

            const pastSession = await prisma.authSession.findUnique({
                where: {id: sessionId}
            });
            
            expect(pastSession).not.toBeNull();

            const originalDigest = pastSession!.currentRefreshDigest;

            //Ok 
            const res = await agent.post("/api/auth/refresh").set("Cookie", `${REFRESH_COOKIE_NAME}=${credential}`).expect(200);
            const cookies = res.headers["set-cookie"];

            const nextSession = await prisma.authSession.findUnique({
                where: {id: sessionId}
            });

            expect(nextSession).not.toBeNull();
            expect(nextSession!.currentRefreshDigest).not.toBe(originalDigest);
            
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/refresh_token=/);
            expect(cookies[0]).toMatch(/HttpOnly/i);

            //Reuse
            const reuse = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", originalCookie);   

            expect(reuse.status).toBe(401);
            expect(reuse.body).toHaveProperty("message", "Refresh credential reuse detected; session revoked");

            const currentSession = await prisma.authSession.findUnique({
                where: {id: sessionId}
            });

            expect(currentSession).not.toBeNull();
            expect(currentSession!.revokedAt).not.toBeNull();
            const cookieHeader = String(reuse.headers["set-cookie"]);

            expect(cookieHeader).toContain(`${REFRESH_COOKIE_NAME}=`);
            expect(cookieHeader).toMatch(/Expires=/i);
        }); 
        
        it("should return 401 if the credentials are invalid", async () => {
            await register();
            const loginResult = await login();
            const cookie = loginResult.headers["set-cookie"][0];

            const invalidCookie = cookie.replace(
                /(?<=\=)[^.]+(?=\.)/,
                "invalid-session"
            );

            const res = await request(app).post('/api/auth/refresh').set("Cookie", invalidCookie);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message", "Invalid or expired refresh session");

            const cookieHeader = String(res.headers["set-cookie"]);

            expect(cookieHeader).toContain(`${REFRESH_COOKIE_NAME}=`);
            expect(cookieHeader).toMatch(/Expires=/i);
        });

        it("should return 409 if there is conflict", async () => {
            await register();
            const agent = request.agent(app);
            const loginResponse = await agent
            .post("/api/auth/login")
            .send(validLogin)
            .expect(200);

            const originalCookie = loginResponse.headers["set-cookie"]![0]!.split(";")[0]!;

            const credential = originalCookie.split("=")[1]!;

            const [res1, res2 ] = await Promise.all([
                request(app).post('/api/auth/refresh').set("Cookie", `${REFRESH_COOKIE_NAME}=${credential}`),
                request(app).post('/api/auth/refresh').set("Cookie", `${REFRESH_COOKIE_NAME}=${credential}`)
            ]);

            const statuses = [res1.status, res2.status]
            expect(statuses).toContain(200);
            expect(statuses).toContain(409);   //NOT A GOOD WAY TO TEST SIMOULTENEOUS REQUESTS
        });
    });

    describe("Logout Tests", () => {
        it("returns 401 when no refresh cookie is provided", async () => {
            const res = await request(app).post("/api/auth/logout");
                
            expect(res.status).toBe(401);    
            expect(res.body).toHaveProperty("message","Refresh Session Required!");

            const cookieHeader = String(res.headers["set-cookie"]);

            expect(cookieHeader).toContain(`${REFRESH_COOKIE_NAME}=`);
            expect(cookieHeader).toMatch(/Expires=/i);
        });

        it("should log out successfully and revoke the session", async () => {
            await register();

            const agent = request.agent(app);

            const loginResponse = await agent
                .post("/api/auth/login")
                .send(validLogin)
                .expect(200);

            const cookie =
                loginResponse.headers["set-cookie"]![0]!.split(";")[0]!;

            const credential = cookie.split("=")[1]!;
            const sessionId = credential.split(".")[0]!;

            const session = await prisma.authSession.findUnique({
                where: { id: sessionId },
            });

            expect(session).not.toBeNull();
            expect(session!.revokedAt).toBeNull();

            const res = await agent
                .post("/api/auth/logout").set("cookie", cookie) 
                .expect(200);

            const currentSession = await prisma.authSession.findUnique({
                where: { id: sessionId },
            });

            expect(currentSession).not.toBeNull();
            expect(currentSession?.revokedAt).not.toBeNull();

            const header = String(res.headers["set-cookie"]);

            const expiresAt = new Date(
                header.split(/Expires=/i)[1]?.split(";")[0] ?? ""
            );

            expect(expiresAt.getTime()).toBeLessThan(Date.now());
        });
    });

    describe("Logout-All Tests", () => {

        it("should return 403 for a non-admin", async () => {
        await register();

        const agent = request.agent(app);

        const loginResult = await agent.post("/api/auth/login").send(validLogin).expect(200);

        const token = loginResult.body.accessToken;

        const res = await agent.post("/api/auth/logout-all").set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty("message", "Unauthorized!");
        });

        it("logs out all sessions", async () => {
            await register();

            const agent = request.agent(app);

            const loginResult = await agent.post("/api/auth/login").send(validLogin).expect(200);

            const token = loginResult.body.accessToken;

            const res = await agent.post("/api/auth/logout-all").set("Authorization", `Bearer ${token}`);
            
            expect(res.status).toBe(200);  //HAVEN'T YET SEEDED AN ADMIN

            expect(res.body).toHaveProperty("message", "Logged Out All Devices!");
        });
    });
});