import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";


export async function checkSubscrptionOwnership(req: Request<{id: string}>, res: Response, next: NextFunction){
    try {
        const userId = req.user!.userId;
        const {id} = req.params;
    
        const subscription = await prisma.subscription.findUnique({
            where: {id}
        });
    
        if(!subscription){
            return res.status(404).json({message: "Subscription not found!"});
        }
        const isOwner = userId === subscription.userId;
        const isAdmin = req.user!.role === "ADMIN";
    
        if(!isAdmin && !isOwner){
            return res.status(403).json({message: "Unauthorized!"});
        }
        next();
    } catch (error) {
        next(error)
    }
};

export async function checkPaymentOwnership(req: Request<{id: string}>, res: Response, next: NextFunction){
    try {
        const userId = req.user!.userId;
        const {id} = req.params;
    
        const payment = await prisma.payment.findUnique({
            where: {id}
        });
    
        if(!payment){
            return res.status(404).json({message: "Payment not found!"});
        }
        const isOwner = userId === payment.userId;
        const isAdmin = req.user!.role === "ADMIN";
    
        if(!isOwner && !isAdmin){
            return res.status(403).json({message: "Unauthorized!"});
        }
        next();
    } catch (error) {
        next(error)
    }
};

export async function checkSessionOwnership(req: Request<{id: string}>, res: Response, next: NextFunction){
    try {
        const userId = req.user!.userId;
        const {id} = req.params;
    
        const session = await prisma.facilitySession.findUnique({
            where: {id}
        })
    
        if(!session){
            return res.status(404).json({message: "Session not found!"});
        }
    
        const isOwner = userId === session.userId;
        const isAdmin = req.user!.role === "ADMIN";
    
        if(!isOwner && !isAdmin){
            return res.status(403).json({message: "Unauthorized!"});
        }
    
        next();
    } catch (error) {
        next(error)
    }
};