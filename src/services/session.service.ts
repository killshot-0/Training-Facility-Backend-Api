import { prisma } from "../lib/prisma.js";
import { SessionQueryInput1, SessionCreateInput1} from "../schemas/session.schemas.js"; 


export function findSessions(id?: string, query?: SessionQueryInput1){
    if(id){
        return prisma.facilitySession.findUnique({
            where: {id}
        });
    }

    return prisma.facilitySession.findMany({
        where: {
            ...(query?.userId !== undefined && {
                userId: query.userId
            }),
            ...(query?.facility !== undefined && {
                facility: {
                    name: query.facility
                }
            }),
            ...((query?.checkInAfter !== undefined || query?.checkInBefore !== undefined) && {
                checkIn: {
                    ...(query?.checkInAfter !== undefined && {
                        gte: query.checkInAfter
                    }),
                    ...(query?.checkInBefore !== undefined && {
                        lte: query.checkInBefore
                    })
                }
            }),
            ...((query?.checkOutAfter !== undefined || query?.checkOutBefore !== undefined) && {
                checkOut: {
                    ...(query.checkOutAfter !== undefined && {
                        gte: query.checkOutAfter
                    }),
                    ...(query.checkOutBefore !== undefined && {
                        lte: query.checkOutBefore
                    })
                }
            })
        }
    });
};

export function postSessions(body: SessionCreateInput1){
    return prisma.facilitySession.create({
        data: {
            user: {
                connect: {id: body.userId}
            },
            facility: {
                connect: {name: body.facility}
            },
            checkIn: new Date()
        }
    });
};

export async function patchSession(id: string){
    const getSession = await prisma.facilitySession.findUnique({
        where: {id}
    }) ;

    if(!getSession || getSession?.checkOut){
        return null
    }

    return prisma.facilitySession.update({
        where: {id},
        data: {
            checkOut: new Date()
        }
    });
};

export function removeSession(id: string){
    return prisma.facilitySession.delete({
        where: {id}
    });
};