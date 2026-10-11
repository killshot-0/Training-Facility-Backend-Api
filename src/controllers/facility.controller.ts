import { Request, Response } from "express";
import * as services from '../services/facility.service.js';

export async function getFacilities(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const facilities = await services.findFacilities(id);
    if(!facilities || (Array.isArray(facilities) && facilities.length === 0)){
        return res.status(404).json({message: "Unable to find Facilities!"});
    }

    return res.status(200).json({message: "Facilities Found!", facilities});
};