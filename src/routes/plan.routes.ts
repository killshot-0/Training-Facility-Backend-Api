import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js"; 
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
    idSchema,
    planQuerySchema 
} from "../schemas/plan.schemas.js";
import * as controllers from '../controllers/plan.controller.js';
import { asyncHandler } from "../utils/async-handler.js";


const planRouter = Router();

planRouter.use(authenticate);

planRouter.get("/", validate(planQuerySchema), asyncHandler(controllers.getPlan));  //get the plans
planRouter.get("/:id", validate(idSchema), asyncHandler(controllers.getPlan));  //get a specific plan

planRouter.get("/price", validate(planQuerySchema), asyncHandler(controllers.getPlanPrice))  //get the price of the plans
planRouter.patch("/:id", validate(idSchema), asyncHandler(controllers.changePlanPrice));   //change plan eg. price
planRouter.get("/facilities", asyncHandler(controllers.getFacilities));   //facilities accessed through a plan


export default planRouter;