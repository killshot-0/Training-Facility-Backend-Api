import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js"; 
import { 
    idSchema,
    planQuerySchema 
} from "../schemas/plan.schemas.js";
import * as controllers from '../controllers/plan.controller.js';

const planRouter = Router();

planRouter.get("/", validate(planQuerySchema), controllers.getPlan);  //get the plans
planRouter.get("/:id", validate(idSchema), controllers.getPlan);  //get a specific plan

planRouter.get("/price", validate(planQuerySchema), controllers.getPlanPrice)  //get the price of the plans
planRouter.patch("/:id", validate(idSchema), controllers.changePlanPrice);   //change plan eg. price
planRouter.get("/facilities", controllers.getFacilities);   //facilities accessed through a plan


export default planRouter;