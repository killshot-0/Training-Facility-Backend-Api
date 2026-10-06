import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema, 
    dataChangeSchema, 
    subscriptionQuerySchema, 
    subscriptionCreateSchema, 
    paymentQuerySchema, 
    sessionQuerySchema ,
    sessionCreateSchema
} from "../schemas/user.schemas.js";
import * as controllers from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/me", controllers.getUsers);  //get the current user
userRouter.patch("/me", validate(dataChangeSchema), controllers.infoChange);    //Allows a user to change their name, email, password
userRouter.delete("/me", controllers.deleteUser);  

userRouter.get("/subscriptions", validate(subscriptionQuerySchema), controllers.getSubscription);  //get the current user's subscription with query options
userRouter.get("/subscriptions:id", validate(idSchema), controllers.getSubscription);  //get a specific subscription of the current user
userRouter.post("/subscription", validate(subscriptionCreateSchema), controllers.createSubscription);   //create a subscription for the current user //Payment should be created along with subscription
userRouter.patch("/subscription/:id/status", validate(idSchema), controllers.changeSubscription);  //change the current user's subscription status to cancelled

userRouter.get("/payments", validate(paymentQuerySchema), controllers.getPayment);
userRouter.get("/payments/:id", validate(idSchema), controllers.getPayment);
userRouter.patch("/payments/:id",validate(idSchema), controllers.cancelPayment);

userRouter.get("/sessions", validate(sessionQuerySchema), controllers.getSessions);
userRouter.get("/sessions/:id", validate(idSchema), controllers.getSessions);
userRouter.post("/sessions", validate(sessionCreateSchema), controllers.createSession);
userRouter.patch("/sessions/:id/checkout", validate(idSchema), controllers.checkOutSession);

export default userRouter;