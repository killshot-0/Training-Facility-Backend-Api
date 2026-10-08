import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { EmailInput } from '../schemas/auth.schemas.js';
import { createToken, verifyAccessToken } from "../utils/access-token.js";
import { 
    REFRESH_TTL_MS,
    createRefreshSecret,
    digestRefreshSecret,
    buildRefreshCredential,
    equalDigest
} from '../utils/refresh-token.js';
import { randomUUID } from 'crypto';


//Restriction for what prisma can return. Example passwordHash
export const safeUserSelect = {
  id: true,
  email: true,
  role: {
    select:{
        name: true
    }
  },
  createdAt: true,
  name: true
} satisfies Prisma.UserSelect;

//Check if user exists in database
export function checkUser(email: EmailInput){
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            createdAt: true,
        }
    })
};


//Add user to the database and return a safe user information 
export function createUser(email:EmailInput, passwordHash: string, name: string){
    return prisma.user.create({
        data:{
            email,
            passwordHash,
            name,
            role:{
                connect:{
                    name: "MEMBER"
                }
            }
        },
        select: safeUserSelect
    })
};

//check if an error is a unique constraint and prisma known error
export function checkError(error: any){
    const check = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    return check;
};

type UserToken = Prisma.UserGetPayload<{
    select: typeof safeUserSelect
}>

export async function giveToken(user: UserToken){
    const sessionId = randomUUID();
    const refreshSecret = createRefreshSecret();
    const refreshDigest = digestRefreshSecret(refreshSecret);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    const session = await prisma.authSession.create({
        data: {
            id: sessionId,
            userId: user.id,
            currentRefreshDigest: refreshDigest,
            expiresAt
        }
    });

    const principal = {
        userId: user.id,
        sessionId: sessionId,
        role: user.role.name
    }

    const accessToken = createToken(principal);
    const refreshCredential = buildRefreshCredential(session.id, refreshSecret);

    return {accessToken, refreshCredential};
};

type RefreshOutcome = 
    | {kind: "ok"; credentials: string; expiresAt: Date; accessToken: string }
    | {kind: "reused"}
    | {kind: "invalid"}
    | {kind: "conflict"}

export async function refreshing(parsed: Parsed){
    const outcome: RefreshOutcome = await prisma.$transaction(async(tx) => {
        const session = await tx.authSession.findUnique({
            where:{ id: parsed?.sessionId },
            include: {
                user: {
                    include:{
                        role: true
                    }
                }
            }
        });
        const now = new Date();

        if(!session || session.expiresAt <= now || session.revokedAt ){
            return {kind: "invalid"}
        }

        const candidate = digestRefreshSecret(parsed!.secret);

        if(!equalDigest(candidate, session.currentRefreshDigest)){
            await tx.authSession.updateMany({
                where: {id:session.id, revokedAt: null},
                data: { revokedAt: now}
            })
            return {kind: "reused"}
        };

        const nextSecret = createRefreshSecret();
        const nextDigest = digestRefreshSecret(nextSecret);

        const updated = await tx.authSession.updateMany({
            where:{
                id: session.id,
                currentRefreshDigest: session.currentRefreshDigest,
                revokedAt: null,
                expiresAt: {gt: now}
            },
            data:{
                currentRefreshDigest: nextDigest
            }
        });
        if(updated.count !== 1){
            return {kind: "conflict"}
        };

        const accessToken = createToken({
            userId: session.user.id,
            sessionId: session.id,
            role: session.user.role.name
        });

        return {
            kind: "ok", 
            credentials: buildRefreshCredential(session.id, nextSecret), 
            expiresAt: session.expiresAt,
            accessToken: accessToken
        };
    });

    return outcome
};

type Parsed = {
    sessionId: string,
    secret: string
} | null

export async function loggingOut(parsed: Parsed){
    
    const session = await prisma.authSession.findUnique({
        where: {id: parsed!.sessionId}
    });

    if(session && !session.revokedAt){
        const candidate = digestRefreshSecret(parsed!.secret);

        if(equalDigest(candidate, session.currentRefreshDigest)){
            await prisma.authSession.update({
                where: {id: parsed!.sessionId},
                data: { revokedAt: new Date()}
            })
        }
    }
};

export function logOutAll(){
    return prisma.authSession.updateMany({
        where: {
            revokedAt: null,
        },
        data:{ revokedAt: new Date()}
    });
};
