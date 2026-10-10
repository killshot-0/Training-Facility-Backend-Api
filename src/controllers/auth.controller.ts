import { Request, Response } from "express";
import { RegisterInput , LoginInput } from "../schemas/auth.schemas.js";
import { hashPassword, verifyPassword } from '../utils/password.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions, refreshCookieBaseOptions, parseRefreshCredential } from "../utils/refresh-token.js";
import * as services from '../services/auth.service.js';
import * as EmailServices from '../services/email.service.js';


//Registration
export async function registering(req: Request, res: Response){
    
    //Extract credentials from request
    const { email, password, name} = req.body as RegisterInput;

    //check if user already exists
    const userExists = await services.checkUser(email);
    if(userExists){
        return res.status(409).json({message: "User already exists"});
    }

    const passwordHash = await hashPassword(password);

    //Store user information to the database
    const user = await services.createUser(email, passwordHash, name);

    res.status(201).json({
        message: "Successfully Registered!",
        user
    });

    //Send a welcome email to the registered user
    EmailServices.sendWelcomeEmail(user.email, user.name)
        .catch((err) => {
            console.error(`[Background Email Error]: Failed to welcome ${req.user!.email}`, err);
    });
};

//Login 
export async function loging(req: Request, res: Response){
    //Extract credentials from request
    const {email, password} = req.body as LoginInput;

    //check if user exists
    const user = await services.checkUser(email);
    if(!user){
        return res.status(400).json({message: "Invalid Email or Password!"})
    }
    if(!user.passwordHash){
        return res.status(404).json({message: "Invalid Email or Password!"})
    };
    const isValid = user ?  await verifyPassword(password, user.passwordHash) : false;

    if(!isValid){
        return res.status(400).json({message: "Invalid Email or Password!"})
    }

    const { accessToken, refreshCredential} = await services.giveToken(user);

    res.cookie(
        REFRESH_COOKIE_NAME,
        refreshCredential,
        refreshCookieOptions
    )

    res.status(200).json({
        message: "Login Successful!",
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role.name,
            createdAt: user.createdAt,
        }
    })
};


export async function refresh(req: Request, res: Response){
    const parsed = parseRefreshCredential(req.cookies?.[REFRESH_COOKIE_NAME]);

    if(!parsed){
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(401).json({message: "Refresh Session Required!"})
    }
    const outcome = await services.refreshing(parsed);

    if(outcome.kind === "conflict"){
        return res.status(409).json({message: "Refresh already used; retry with the newest credential"})
    }

    if(outcome.kind === "invalid" || outcome.kind === "reused"){
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(401).json({
            message: 
                outcome.kind === "invalid" 
            ? "Invalid or expired refresh session"
            :"Refresh credential reuse detected; session revoked" 
        });
    };

    const remaining = Math.max(
        0,
        outcome.expiresAt.getTime() - Date.now()
    );

    res.cookie(
        REFRESH_COOKIE_NAME, 
        outcome.credentials, 
        { 
            ...refreshCookieBaseOptions, 
            maxAge: remaining
        });

    return res.status(200).json({
        accessToken: outcome.accessToken
    });
};

export async function logout(req: Request, res: Response){
    const parsed = parseRefreshCredential(req.cookies?.[REFRESH_COOKIE_NAME]);

    if(!parsed){
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(401).json({message: "Refresh Session Required!"});
    }
    await services.loggingOut(parsed);

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions);
    return res.status(200).json({message: "Logged Out!"})
};

export async function logoutAll(req: Request, res: Response){
    await services.logOutAll();

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions);
    return res.status(200).json({message: "Logged Out All Devices!"});
};