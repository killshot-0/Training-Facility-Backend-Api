import { Request, Response } from "express";
import { askAI } from "../services/ai.service.js";
import * as services from '../services/ai.service.js';

export async function askModel(req: Request, res: Response){
    const body = req.body;
    
    const result = await services.askAI(body);
    if(!result){
        return res.status(404).json({message: "Unabel to get response from model!"});
    }

    return res.status(200).json({message: "Model responded successfully!", result});
};