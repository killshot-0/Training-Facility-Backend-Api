import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from "../src/lib/prisma.js";
import { cleanDatabase, seed } from "./helpers/factory.js";
import { REFRESH_COOKIE_NAME } from "../src/utils/refresh-token.js";
import * as oauthServices from "../src/services/oauth.service.js";
import * as authServices from "../src/services/auth.service.js";
import { OAUTH_TRANSACTION_COOKIE, encodeOAuthTransaction} from "../src/utils/oauth.js";

export const validUser = {
  name: "Hana",
  email: "hana@example.com",
  password: "one plus one equal two",
};

export const validLogin = {
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

    describe("Google OAuth Tests", () => {
        const transaction = {
            state: "test-state",
            nonce: "test-nonce",
            codeVerifier: "test-code-verifier"
        };

        const authorizationUrl =
            "https://accounts.google.com/o/oauth2/v2/auth?client_id=test";

        const oauthUser = {
            id: "test-user-id",
            name: "Hana",
            email: "hana@example.com",
            role: "MEMBER",
            createdAt: new Date()
        };

        const accessToken = "test-access-token";
        const refreshCredential = "test-session-id.test-refresh-secret";

        function getTransactionCookie() {
            return `${OAUTH_TRANSACTION_COOKIE}=${encodeOAuthTransaction(transaction)}`;
        }

        it("should redirect to Google and set the OAuth transaction cookie", async () => {
            vi.spyOn(oauthServices, "startGoogleOAuth")
                .mockResolvedValueOnce({
                    authorizationUrl,
                    ...transaction
                });

            const res = await request(app).get("/api/auth/google");

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe(authorizationUrl);

            const cookies = res.headers["set-cookie"];

            expect(cookies).toBeDefined();

            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            const transactionCookie = cookieArray.find(cookie =>
                cookie.startsWith(`${OAUTH_TRANSACTION_COOKIE}=`)
            );

            expect(transactionCookie).toBeDefined();
            expect(transactionCookie).toMatch(/HttpOnly/i);
            expect(transactionCookie).toMatch(/SameSite=Lax/i);
            expect(transactionCookie).toMatch(/Path=\/auth/i);
        });

        it("should return 500 when Google OAuth initialization fails", async () => {
            vi.spyOn(oauthServices, "startGoogleOAuth")
                .mockRejectedValueOnce(new Error("OAuth initialization failed"));

            const res = await request(app).get("/api/auth/google");

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty(
                "message",
                "Couldn't start Google Auth!"
            );
        });

        it("should return 400 when the transaction cookie is missing", async () => {
            const res = await request(app)
                .get("/api/auth/google/callback?code=test-code&state=test-state");

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Transaction not found!");
        });

        it("should return 400 when the transaction cookie is invalid", async () => {
            const res = await request(app)
                .get("/api/auth/google/callback?code=test-code&state=test-state")
                .set("Cookie", `${OAUTH_TRANSACTION_COOKIE}=invalid-transaction`);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("message", "Invalid Transaction!");
        });

        it("should successfully authenticate using Google OAuth", async () => {
            vi.spyOn(oauthServices, "handleCallback")
                .mockResolvedValueOnce(oauthUser as any);

            vi.spyOn(authServices, "giveToken")
                .mockResolvedValueOnce({
                    accessToken,
                    refreshCredential
                } as any);

            const res = await request(app)
                .get("/api/auth/google/callback?code=test-code&state=test-state")
                .set("Cookie", getTransactionCookie());

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty(
                "message",
                "Authentication Successfully!"
            );
            expect(res.body.accessToken).toBe(accessToken);
            expect(res.body.user).toMatchObject({
                id: oauthUser.id,
                email: oauthUser.email,
                name: oauthUser.name
            });

            expect(oauthServices.handleCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    state: transaction.state,
                    nonce: transaction.nonce,
                    codeVerifier: transaction.codeVerifier,
                    callbackUrl: expect.any(URL)
                })
            );

            expect(authServices.giveToken).toHaveBeenCalled();

            const cookies = res.headers["set-cookie"];

            expect(cookies).toBeDefined();

            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            const refreshCookie = cookieArray.find(cookie =>
                cookie.startsWith("refresh_token=")
            );

            expect(refreshCookie).toBeDefined();
            expect(refreshCookie).toMatch(/HttpOnly/i);

            const clearedTransactionCookie = cookieArray.find(cookie =>
                cookie.startsWith(`${OAUTH_TRANSACTION_COOKIE}=`)
            );

            expect(clearedTransactionCookie).toBeDefined();
            expect(clearedTransactionCookie).toMatch(/Expires=/i);
        });

        it("should return 400 when Google callback processing fails", async () => {
            vi.spyOn(oauthServices, "handleCallback")
                .mockRejectedValueOnce(new Error("Google authentication failed"));

            const res = await request(app)
                .get("/api/auth/google/callback?code=test-code&state=test-state")
                .set("Cookie", getTransactionCookie());

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty(
                "message",
                "Authentication Failed!"
            );
        });

        it("should return 400 when token generation fails", async () => {
            vi.spyOn(oauthServices, "handleCallback")
                .mockResolvedValueOnce(oauthUser as any);

            vi.spyOn(authServices, "giveToken")
                .mockRejectedValueOnce(new Error("Token generation failed"));

            const res = await request(app)
                .get("/api/auth/google/callback?code=test-code&state=test-state")
                .set("Cookie", getTransactionCookie());

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty(
                "message",
                "Authentication Failed!"
            );
        });
    });
});