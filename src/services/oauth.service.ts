import { prisma } from '../lib/prisma.js';
import { getGoogleClient } from '../lib/oauth.js';

import{
    randomState,
    randomNonce,
    buildAuthorizationUrl,
    randomPKCECodeVerifier,
    calculatePKCECodeChallenge,
    authorizationCodeGrant,
    fetchUserInfo,
    type Configuration
} from "openid-client";


export interface OAuthStartResult{
    authorizationUrl: string,
    state: string,
    nonce: string,
    codeVerifier: string
};

export async function startGoogleOAuth(): Promise<OAuthStartResult>{
    const client = await getGoogleClient();

    const state = randomState();
    const nonce = randomNonce();

    const codeVerifier = randomPKCECodeVerifier();

    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    const authorizationUrl = buildAuthorizationUrl(
        client,
        {
            redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
            scope: "openid email profile",
            response_type: "code",
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: "S256"
        }
    );
    return {
        authorizationUrl: authorizationUrl.href,
        state,
        nonce,
        codeVerifier
    };
};


export interface callbackInput {
    callbackUrl: URL;
    state: string,
    nonce: string,
    codeVerifier: string
} 
export async function handleCallback(callbackUrl: callbackInput){
    const client = await getGoogleClient();

    const tokens = await authorizationCodeGrant(
        client,
        callbackUrl.callbackUrl,
        {
            pkceCodeVerifier: callbackUrl.codeVerifier,
            expectedState: callbackUrl.state,
            expectedNonce: callbackUrl.nonce
        }
    );
    const claims = tokens.claims();

    if(!claims){
        throw new Error("claims not found!")
    }
    const providerAccountID = claims.sub;

    const email = typeof claims.email === "string" ? claims.email : undefined;

    const name = typeof claims.name === "string" ? claims.name : undefined;

    if(!providerAccountID){
        throw new Error("Sub not provided!")
    }
    if(!email){
        throw new Error("Email not provided!")
    }
    if(!name){
        throw new Error("Name not provided!")
    }

    const user = await findorCreateAccount({
        provider: "Google",
        providerAccountID,
        email,
        name
    });

    return user;
};

interface Account {
    provider: string,
    providerAccountID: string,
    email: string,
    name: string
}
export async function findorCreateAccount(input: Account){
    const account = await prisma.account.findUnique({
        where: {
            provider_providerAccountId:{
                provider: input.provider,
                providerAccountId: input.providerAccountID
            }
        },
        include: {
            user: {
                include: {
                    role: true
                }
            }
        }
    });
    if(account){
        return account.user;
    }

    const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: {role: true}
    });

    if(user){
        const newAccount = prisma.account.create({
            data: {
                userId: user.id,
                provider: input.provider,
                providerAccountId: input.providerAccountID,
            }
        });
        return user;
    };

    const newUser = prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            role:{
                connect:{
                    name: "MEMBER"
                }
            },
            accounts: {
                create: {
                    provider: input.provider,
                    providerAccountId: input.providerAccountID
                }
            },
        },
        include: { role: true }
    });
    return newUser;
};