import { Request, Response } from "express";
import * as services from '../services/subscripton.service.js';


export async function getSubscription(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const query = req.body;

    const subscription = await services.findSubscription(id, query);
    if(!subscription){
        return res.status(404).json({message: "Subscription not Foudn!"});
    }

    return res.status(200).json({message: "Subscription Found!", subscription});
};

export async function UsersWithSubscriptions(req: Request, res: Response){
    const users = await services.findUsersWithSubscriptions();
    if(!users){
        return res.status(404).json({message: "No Users with Subscriptions found!"})
    }
    return res.status(200).json({message: "Successfully found Users with Subscription", users});
};

export async function createSubscription(req: Request, res: Response){
    const body = req.body;

    const {subscription, payment} = await services.postSubscription(body);
    if(!subscription){
        return res.status(404).json({message: "Unable to create Subscription!"})
    }
    if(!payment){
        return res.status(404).json({message: "Unable to create Payment!"})
    }
    return res.status(201).json({message: "Successfully Created Subscription and Payment", subscription, payment});
};

export async function changeSubscriptionStatus(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const body = req.body;

    const subscription = await services.patchSubscriptionStatus(id, body);
    if(!subscription){
        return res.status(404).json({message: "Unable to change Status!"});
    }

    return res.status(200).json({message: "Successfully Change Status!", subscription})
};

export async function deleteSubscription(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const subscription = await services.removeSubscription(id);
    if(!subscription){
        return res.status(404).json({message: "Unable to Delete Subscription!"});
    }
    
    return res.status(200).json({message: "Subscription Successfully Deleted!"});
};