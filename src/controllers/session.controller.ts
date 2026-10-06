import { Request, Response } from "express";
import * as services from '../services/session.service.js';

export async function getSessions(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const query = req.query;

    const session = await services.findSessions(id, query);
    if(!session){
        return res.status(404).json({message: "Unable to find Sessions"});
    }

    return res.status(200).json({message: "Sessions Found!", session});
};

export async function createSession(req: Request, res: Response){
    const body = req.body;

    const session = await services.postSessions(body);
    if(!session){
        return res.status(404).json({message: "Unable to Create Session!"});
    }

    return res.status(201).json({message: "Session Successfully Created!", session});
};

export async function checkoutSession(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const session = await services.patchSession(id);
    if(!session){
        return res.status(404).json({message: "Unable to Check Out!"});
    }

    return res.status(200).json({message: "Checked Out Successfully!", session});
};

export async function deleteSession(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const session = await services.removeSession(id);
    if(!session){
        return res.status(404).json({message: "Unable to Delete Session!"});
    }

    return res.status(200).json({message: "Session Deleted Successfully!"});
};