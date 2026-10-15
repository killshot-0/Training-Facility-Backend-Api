import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client.js";

export async function errorHandler(err: any, req: Request, res: Response, next: NextFunction){
    if(err instanceof multer.MulterError){
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json(
                {
                    message: "File upload rejected: Maximum allowed file size is 5MB"
                }
            );
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json(
                {
                    message: `Unexpected form-data field: '${err.field}' is not allowed`
                }
            );
        }

        return res.status(400).json(
            {
                message: `Upload error: ${err.message}`
            }
        );
    }
    if (err.name === "ZodError") {
        return res.status(400).json(
            {
                error: "Validation Error",details: err.errors
            }
        );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError &&err.code === "P2002"){
        return res.status(409).json(
            {
                message: "A plan with this unique value already exists!",
            }
        );
    }

    const status = err.status || 500
    const message = err.message || "Internal server error"
    console.error("Unhandled Error:", err.message);
    return res.status(status).json({ error: message });
};