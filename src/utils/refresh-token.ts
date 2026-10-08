import { randomBytes, timingSafeEqual, createHash } from "crypto";
import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = "refresh_token";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const refreshCookieBaseOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/auth",
}

export const refreshCookieOptions = {
    ...refreshCookieBaseOptions,
    maxAge: REFRESH_TTL_MS
}

export function createRefreshSecret(): string{
    return randomBytes(32).toString("base64url")
}

export function digestRefreshSecret(secret: string): string{
    return createHash("sha256").update(secret).digest("hex")
}

export function buildRefreshCredential(sessionId: string, secret: string): string{
    return `${sessionId}.${secret}`
}

export function parseRefreshCredential(value: string | undefined){
    if(!value) return null;

    const parts = value.split(".")
    if(parts.length !== 2 || !parts[0]|| !parts[1]) return null;

    return { sessionId: parts[0], secret: parts[1]};
};

export function equalDigest(candidate: string, stored: string){
    const left =  Buffer.from(candidate, "hex");
    const right = Buffer.from(stored, "hex");

    return left.length === right.length && timingSafeEqual(left, right);
};