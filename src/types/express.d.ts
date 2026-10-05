import { RoleName } from "../generated/prisma/enums.ts"

export interface AuthPrincipal {
    userId: string,
    sessionId: string,
    role: RoleName
};

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPrincipal
        }
    }
};

export interface AuthUser {
    userId: string,
    email: string,
    role: string,
    permissions: string[],
    tokenVersion: number
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
};

export {}