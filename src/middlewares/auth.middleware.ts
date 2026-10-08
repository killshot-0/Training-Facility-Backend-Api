import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/access-token.js"
import { prisma } from "../lib/prisma.js"


export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const token = authHeader.split(" ")[1];

    let payload
    try {
        payload = verifyAccessToken(token)
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" })
    }

    req.auth = {
        userId: payload.userId,
        sessionId: payload.sessionId,
        role: payload.role
    };

    const session = await prisma.authSession.findUnique({
        where: { id: payload.sessionId },
        include: {
            user: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!session || !session.user || session.expiresAt < new Date()) {
        return res.status(401).json({ message: "Invalid or expired session" })
    }

    const user = session.user

    req.user = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions.map(rp => rp.permission.action),
        tokenVersion: user.tokenVersion,
    }

    next()
}