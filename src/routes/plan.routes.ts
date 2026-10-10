import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permission } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validate.middleware.js"; 
import { 
    idSchema,
    planQuerySchema,
    priceChangeSchema 
} from "../schemas/plan.schemas.js";
import * as controllers from '../controllers/plan.controller.js';
import { asyncHandler } from "../utils/async-handler.js";



const planRouter = Router();

planRouter.use(authenticate);

planRouter.get("/", permission("plans:read:any"), validate(planQuerySchema), asyncHandler(controllers.getPlan));  //get the plans
planRouter.get("/:id", permission("plans:read:any"), validate(idSchema), asyncHandler(controllers.getPlan));  //get a specific plan

planRouter.get("/price", permission("plans:read:any"), validate(planQuerySchema), asyncHandler(controllers.getPlanPrice))  //get the price of the plans
planRouter.get("/facilities", permission("plans:read:any"), asyncHandler(controllers.getFacilities));   //facilities accessed through a plan


export default planRouter;