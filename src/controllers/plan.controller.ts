import { Request, Response } from "express";
import * as services from '../services/plan.service.js';


export async function getPlan(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const query = req.query;

    const plan = await services.findPlan(id, query);
    if(!plan){
        return res.status(404).json({message: "Unable to Find Plan"});
    }

    return res.status(200).json({messaeg: "Plans Found!", plan});
};

export async function getPlanPrice(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const query = req.query;

    const price = await services.findPrice(id, query);
    if(!price){
        return res.status(404).json({message: "Unable to Find Price"});
    }

    return res.status(200).json({messaeg: "Prices Found!", price});
};

export async function changePlanPrice(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const body = req.body;

    const price = await services.patchPlanPrice(id, body);
    if(!price){
        return res.status(404).json({message: "Unable to Change Price"});
    }

    return res.status(200).json({messaeg: "Prices Changed!", price});
}; 

export async function getFacilities(req: Request, res: Response){
    const facilities = await services.getFacilities();
    if(!facilities){
        return res.status(404).json({message: "Unable to find Facilities!"});
    }
    return res.status(200).json({message: "Facilities Found!", facilities});
};

