import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permission } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    subscriptionQuery1Schema,
    subscriptionCreate1Schema,
    subscriptionChangeSchema
} from "../schemas/subscription.schemas.js";
import * as controllers from '../controllers/subscription.controller.js';
import { asyncHandler } from "../utils/async-handler.js";


const subscriptionRouter = Router();

subscriptionRouter.use(authenticate);

subscriptionRouter.get("/", permission("subscriptions:read:any"), validate(subscriptionQuery1Schema), asyncHandler(controllers.getSubscription));   //get all subscriptions with query options
subscriptionRouter.get("/:id", permission("subscriptions:read:any"), validate(idSchema), asyncHandler(controllers.getSubscription));   //get a specific subscriptions
subscriptionRouter.get("/users", permission("subscriptions:read:any"), asyncHandler(controllers.UsersWithSubscriptions));   //get users with subscriptions with a certain status

subscriptionRouter.post("/", permission("subscriptions:create:any"), validate(subscriptionCreate1Schema), asyncHandler(controllers.createSubscription));   //create a subscription for a user

subscriptionRouter.patch("/:id/status", permission("subscriptions:update:any"), validate(subscriptionChangeSchema), asyncHandler(controllers.changeSubscriptionStatus));  //change the status of user's subscription


export default subscriptionRouter;