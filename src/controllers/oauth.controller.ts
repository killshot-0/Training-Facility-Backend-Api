import { Request, Response } from "express";
import * as services from '../services/oauth.service.js';
import * as authservices from '../services/auth.service.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions, refreshCookieBaseOptions, parseRefreshCredential } from "../utils/refresh-token.js";
import { OAUTH_TRANSACTION_COOKIE, maxAge, encodeOAuthTransaction, decodeOAuthTransaction } from "../utils/oauth.js";

export async function googleLogin(req: Request, res: Response){
    try {
        const result = await services.startGoogleOAuth();
        
        const transaction = {
            state: result.state,
            nonce: result.nonce,
            codeVerifier: result.codeVerifier
        };

        const encoded = encodeOAuthTransaction(transaction);

        res.cookie(
            OAUTH_TRANSACTION_COOKIE,
            encoded,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: maxAge,
                path: '/auth'
            }
        );
           
        return res.redirect(result.authorizationUrl);
    } catch (error) {
        return res.status(500).json({message: "Couldn't start Google Auth!"});
    };
};

export async function callback(req: Request, res: Response){
    try {
        
        const encoded = req.cookies?.[OAUTH_TRANSACTION_COOKIE];
    
        if(!encoded){
            return res.status(400).json({message: "Transaction not found!"});
        }
    
        const transaction = decodeOAuthTransaction(encoded);
    
        if(!transaction){
            return res.status(400).json({message: "Invalid Transaction!"});
        }
    
        res.clearCookie(
            OAUTH_TRANSACTION_COOKIE,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/auth'
            }
        );
        const callbackUrl = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
    
        const result = await services.handleCallback({
            callbackUrl,
            state: transaction.state,
            nonce: transaction.nonce,
            codeVerifier: transaction.codeVerifier
        });

        //access and refresh token
        const tokenUser = {
            id: result.id,
            createdAt: result.createdAt,
            email: result.email,
            role: result.role
        }

        const {accessToken, refreshCredential} = await authservices.giveToken(tokenUser);

        res.cookie(
            REFRESH_COOKIE_NAME,
            refreshCredential,
            refreshCookieOptions
        )
    
        return res.status(200).json({message: "Authentication Successfully!", accessToken, user: result})
    } catch (error) {
        return res.status(400).json({message: "Authentication Failed!"})
    } 
};