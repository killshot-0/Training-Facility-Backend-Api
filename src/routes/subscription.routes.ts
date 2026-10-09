import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
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

subscriptionRouter.get("/", validate(subscriptionQuery1Schema), asyncHandler(controllers.getSubscription));   //get all subscriptions with query options
subscriptionRouter.get("/:id", validate(idSchema), asyncHandler(controllers.getSubscription));   //get a specific subscriptions
subscriptionRouter.get("/users", asyncHandler(controllers.UsersWithSubscriptions));   //get users with subscriptions with a certain status

subscriptionRouter.post("/", validate(subscriptionCreate1Schema), asyncHandler(controllers.createSubscription));   //create a subscription for a user

subscriptionRouter.patch("/:id/status", validate(subscriptionChangeSchema), asyncHandler(controllers.changeSubscriptionStatus));  //change the status of user's subscription

subscriptionRouter.delete("/:id", validate(idSchema), asyncHandler(controllers.deleteSubscription));  //delete a subscription (ADMIN only)

export default subscriptionRouter;