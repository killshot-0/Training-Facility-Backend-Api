import { Request, Response } from "express";
import * as services from '../services/user.service.js';
import * as EmailServices from '../services/email.service.js';

export async function getUsers(req: Request, res: Response){
    const id = req.user!.userId;
    
    const user = await services.findUser(id);
    
    if(!user){
        return res.status(404).json({message: "Couldn't find user"});
    }
    return res.status(200).json({message: "User Fetched Successfully!", user})
};

export async function infoChange(req: Request, res: Response){
    const id = req.user!.userId;
    const data = req.body;

    const user = await services.infoPatch(id, data);
    if(!user){
        return res.status(400).json({message: "Failed to Update!"});
    }
    return res.status(200).json({message: "Updated Successfully!", user});
};

export async function uploadAvatar(req: Request, res: Response){
    const userId = req.user!.userId;
    const file = req.file as Express.Multer.File;

    const user = await services.addAvatar(userId, file);
    if(!user){
        return res.status(404).json({message: "Unable to upload avatar!"});
    }

    return res.status(200).json({message: "Avatar uploaded Successfully!", user});
};

export async function deleteAvatar(req: Request, res: Response){
    const userId = req.user!.userId;
    
    const user = await services.removeAvatar(userId);
    if(!user){
        return res.status(404).json({message: "Unable to delete avatar!"});
    }

    return res.status(200).json({message: "Avatar deleted successfully!", user});
};

export async function deleteUser(req: Request, res: Response){
    const id = req.user!.userId;

    const user = await services.userDelete(id);
    if(!user){
        return res.status(400).json({message: "Couldn't Delete User!"})
    }
    return res.status(200).json({message: "Deleted Successfully!"})
};

export async function getSubscription(req: Request<{id:string}>, res: Response){
    const {id} = req.params;
    const userId = req.user!.userId;
    const query = req.query;

    const subscription = await services.findSubscription(userId, id, query);
    if(!subscription){
        return res.status(404).json({message: "No Subscriptions Found!"});
    }
    return res.status(200).json({message: "Subscriptions:", subscription});
};

export async function createSubscription(req: Request, res: Response){
    const body = req.body;
    const userId = req.user!.userId;

    const {subscription, payment} = await services.postSubscription(userId, body);
    if(!subscription){
        return res.status(404).json({message: "Unable to create Subscription!"})
    }
    if(!payment){
        return res.status(404).json({message: "Unable to create Payment!"})
    }
    res.status(201).json({message: "Successfully Created Subscription and Payment!", subscription, payment});

    EmailServices.sendSubscriptionConfirmation(req.user!.email, {
        memberName: subscription.user.name,
        plan: subscription.plan.name,
        membership: subscription.membership,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        amountToPay: payment.amount.toString()
    }).catch((err) => {
        console.error(`[Background Email Error]: Failed to notify ${req.user!.email}`, err);
    });
};

export async function changeSubscription(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const subscription = await services.cancelSubscription(id);
    if(!subscription){
        return res.status(404).json({message: "Unable to change status"});
    }
    return res.status(200).json({message: "Successfully Updated Status!", subscription});
};

export async function getPayment(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const userId = req.user!.userId;
    const query = req.query;

    const payment = await services.findPayment(userId, id, query);
    if(!payment){
        return res.status(404).json({message: "Unabele to Find Payment!"});
    }

    return res.status(200).json({message: "Payment Found!", payment});
};

export async function cancelPayment(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const payment = await services.patchPayment(id);
    if(!payment){
        return res.status(404).json({message: "Unable to change status!"});
    }

    return res.status(200).json({message: "Cancelled Payment!", payment});
};

export async function uploadPayment(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const file = req.file! as Express.Multer.File;

    const payment = await services.addPayment(id, file);
    if(!payment){
        return res.status(404).json({message: "Unable to upload Payment!"});
    }

    return res.status(200).json({message: "Payment uploaded successfully!", payment});
};

export async function getSessions(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const userId = req.user!.userId;
    const query = req.query;

    const session = await services.findSession(userId, id, query);
    if(!session){
        return res.status(404).json({message: "Session not Found!"});
    }

    return res.status(200).json({message: "Session Found!", session});
};

export async function createSession(req: Request, res: Response){
    const body = req.body; 
    const userId = req.user!.userId;

    const session = await services.postSession(userId, body);
    if(!session){
        return res.status(404).json({message: "Unable to create a session"});
    }
    return res.status(201).json({message: "Session Created Successfully!", session});
};

export async function checkOutSession(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const session = await services.checkOut(id);
    if(!session){
        return res.status(404).json({message: "Unable to Check Out!"});
    }

    return res.status(200).json({message: "Checked Out Successfully!", session});
};