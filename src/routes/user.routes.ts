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

userRouter.get("/me", controllers.getUsers);
userRouter.patch("/me", validate(dataChangeSchema), controllers.infoChange);    //Allows a user to change their name, email, password
userRouter.delete("/me", controllers.deleteUser);

userRouter.get("/subscriptions", validate(subscriptionQuerySchema), controllers.getSubscription);
userRouter.get("/subscriptions:id", validate(idSchema), controllers.getSubscription);
userRouter.post("/subscription", validate(subscriptionCreateSchema), controllers.createSubscription);   //Payment should be created along with subscription
userRouter.patch("/subscription/:id/status", validate(idSchema), controllers.changeSubscription);
userRouter.delete("/subscription/:id", validate(idSchema), controllers.deleteSubscription);

userRouter.get("/payments", validate(paymentQuerySchema), controllers.getPayment);
userRouter.get("/payments/:id", validate(idSchema), controllers.getPayment);
userRouter.patch("/payments/:id",validate(idSchema), controllers.cancelPayment);

userRouter.get("/sessions", validate(sessionQuerySchema), controllers.getSessions);
userRouter.get("/sessions/:id", validate(idSchema), controllers.getSessions);
userRouter.post("/sessions", validate(sessionCreateSchema), controllers.createSession);
userRouter.patch("/sessions/:id/checkout", validate(idSchema), controllers.checkOutSession);

export default userRouter;