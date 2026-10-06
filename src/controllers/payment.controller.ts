import { Request, Response } from "express";
import * as services from '../services/payment.service.js';

export async function getPayments(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const query = req.query;

    const payment = await services.findPayment(id, query);
    if(!payment){
        return res.status(404).json({message: "Unable to find Payment!"});
    }
    return res.status(200).json({message: "Payment Found!", payment});
};

export async function changePaymentStatus(req: Request<{id: string}>, res: Response){
    const {id} = req.params;
    const body = req.body;

    const payment = await services.patchPayment(id, body);
    if(!payment){
        return res.status(404).json({message: "Unable to Change Status"});
    }

    return res.status(200).json({message: "Status Changes Successfully!", payment});
};

export async function deletePayment(req: Request<{id: string}>, res: Response){
    const {id} = req.params;

    const payment = await services.removePayment(id);
    if(!payment){
        return res.status(404).json({message: "Unable to Delete payment!"});
    }
    return res.status(200).json({message: "Payment Deleted Successfully!"});
};