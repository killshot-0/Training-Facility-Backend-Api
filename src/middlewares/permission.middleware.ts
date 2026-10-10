import { NextFunction, Request, Response } from "express";

export const permission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const userPermissions = req.user!.permissions;
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        next();
    };
};