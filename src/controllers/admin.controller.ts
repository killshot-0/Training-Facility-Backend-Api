import { Request, Response } from 'express';
import * as services from '../services/admin.service.js';
import * as authControllers from '../controllers/auth.controller.js';
import * as facilityControllers from '../controllers/facility.controller.js';
import * as paymentControllers from '../controllers/payment.controller.js';
import * as planControllers from '../controllers/plan.controller.js';
import * as sessionControllers from '../controllers/session.controller.js';
import * as subscriptionControllers from '../controllers/subscription.controller.js';
import * as userControllers from '../controllers/user.controller.js';

export async function getUsers(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const users = await services.findUser(id);
    if(!users){
        return res.status(404).json({message: "Users not found!"});
    }

    return res.status(200).json({message: "Users found!", users});
};

export async function changeRole(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const body = req.body;

    const user = await services.patchRole(id, body);
    if(!user){
        return res.status(404).json({message: "Unable to change role!"});
    }

    return res.status(200).json({message: "User role changed successfully!", user});
};

export async function deleteUser(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const user = await services.removeUser(id);
    if(!user){
        return res.status(404).json({message: "Unable to delete user!"});
    }

    return res.status(200).json({message: "User deleted successfully!", user});
};

export async function createPlan(req: Request, res: Response) {
    const body = req.body;
    
    const plan = await services.postPlan(body);
    if(!plan){
        return res.status(404).json({message: "Unable to create plan!"});
    }

    return res.status(200).json({message: "Plan successfully created!", plan});
};

export async function deletePlan(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const plan = await services.removePlan(id);
    if(!plan){
        return res.status(404).json({message: "Unable to delete plan!"});
    }

    return res.status(200).json({message: "Plan successfully delete!", plan});
};

export async function createFacility(req: Request, res: Response){
    const body = req.body;

    const facility = await services.postFacility(body);
    if(!facility){
        return res.status(404).json({message: "Unable to create facility!"});
    }

    return res.status(200).json({message: "Facility successfully created!", facility});
};

export async function deleteFacility(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const facility = await services.removeFacility(id);
    if(!facility){
        return res.status(404).json({message: "Unable to delete facility!"});
    }

    return res.status(200).json({message: "Facility successfully deleted!", facility});
};

export async function usersByRole(req: Request, res: Response){
    const body = req.body;

    const users = await services.findUsersByRole(body);
    if(!users){
        return res.status(404).json({message: "Unable to find users by this role!"});
    }

    return res.status(200).json({message: "Users with this role found!", users});
};


export {
    authControllers,
    facilityControllers,
    paymentControllers,
    planControllers,
    sessionControllers,
    subscriptionControllers,
    userControllers
};