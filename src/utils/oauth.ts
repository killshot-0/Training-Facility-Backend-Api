import crypto from "node:crypto";


export interface OAuthTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export const OAUTH_TRANSACTION_COOKIE = "oauth_transaction";

export const maxAge = 10 * 60 * 1000;

function getSecret(): string{
    const secret = process.env.COOKIE_SECRET ;
    if(!secret){
        throw new Error("COOKIE SECRET not configured!")
    }
    return secret;
}

function sign(value: string): string{
    return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function encodeOAuthTransaction(transaction: OAuthTransaction): string{
    const payload = Buffer.from(JSON.stringify(transaction)).toString("base64url");

    const signature = sign(payload);

    return `${payload}.${signature}`;
}

export function decodeOAuthTransaction(encoded: string):OAuthTransaction | null{
    const [payload, signature] = encoded.split(".") ;

    if(!payload || !signature){
        return null;
    }

    const expectedSignature = sign(payload);

    const recieved = Buffer.from(signature,"base64url");

    const expected = Buffer.from(expectedSignature,"base64url");

    if(recieved.length !== expected.length){
        return null;
    }
    
    if(!crypto.timingSafeEqual(recieved, expected)){
        return null;
    }

    try {
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));

        return decoded;
    } catch (error) {
        return null;
    }
};