import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    subscriptionQuery1Schema,
    subscriptionCreate1Schema,
    subscriptionChangeSchema
} from "../schemas/subscription.schemas.js";
import * as controllers from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.get("/", validate(subscriptionQuery1Schema), controllers.getSubscription);   //get all subscriptions with query options
subscriptionRouter.get("/:id", validate(idSchema), controllers.getSubscription);   //get a specific subscriptions
subscriptionRouter.get("/users", controllers.UsersWithSubscriptions);   //get users with subscriptions with a certain status

subscriptionRouter.post("/", validate(subscriptionCreate1Schema), controllers.createSubscription);   //create a subscription for a user

subscriptionRouter.patch("/:id/status", validate(subscriptionChangeSchema), controllers.changeSubscriptionStatus);  //change the status of user's subscription

subscriptionRouter.delete("/:id", validate(idSchema), controllers.deleteSubscription);  //delete a subscription (ADMIN only)

export default subscriptionRouter;