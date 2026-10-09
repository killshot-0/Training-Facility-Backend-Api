import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
    idSchema, 
    dataChangeSchema, 
    subscriptionQuerySchema, 
    subscriptionCreateSchema, 
    paymentQuerySchema, 
    sessionQuerySchema ,
    sessionCreateSchema
} from "../schemas/user.schemas.js";
import { avatarFileSchema } from "../schemas/file.schemas.js";
import { upload } from "../config/multer.js";
import * as controllers from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", asyncHandler(controllers.getUsers));  //get the current user
userRouter.patch("/me", validate(dataChangeSchema), asyncHandler(controllers.infoChange));    //Allows a user to change their name, email, password
userRouter.patch("/me/avatar", upload.single("avatar"), validate(avatarFileSchema), asyncHandler(controllers.uploadAvatar));   //Upload a user's avatar
userRouter.patch("/me/remove-avatar", asyncHandler(controllers.deleteAvatar));   //Remove the user's avatar
userRouter.delete("/me", asyncHandler(controllers.deleteUser));  

userRouter.get("/subscriptions", validate(subscriptionQuerySchema), asyncHandler(controllers.getSubscription));  //get the current user's subscription with query options
userRouter.get("/subscriptions:id", validate(idSchema), asyncHandler(controllers.getSubscription));  //get a specific subscription of the current user
userRouter.post("/subscription", validate(subscriptionCreateSchema), asyncHandler(controllers.createSubscription));   //create a subscription for the current user //Payment should be created along with subscription
userRouter.patch("/subscription/:id/status", validate(idSchema), asyncHandler(controllers.changeSubscription));  //change the current user's subscription status to cancelled

userRouter.get("/payments", validate(paymentQuerySchema), asyncHandler(controllers.getPayment));
userRouter.get("/payments/:id", validate(idSchema), asyncHandler(controllers.getPayment));
userRouter.patch("/payments/:id",validate(idSchema), asyncHandler(controllers.cancelPayment));
userRouter.patch("/payment/:id/upload");   //Users can uplaod an image of a payment receipt

userRouter.get("/sessions", validate(sessionQuerySchema), asyncHandler(controllers.getSessions));
userRouter.get("/sessions/:id", validate(idSchema), asyncHandler(controllers.getSessions));
userRouter.post("/sessions", validate(sessionCreateSchema), asyncHandler(controllers.createSession));
userRouter.patch("/sessions/:id/checkout", validate(idSchema), asyncHandler(controllers.checkOutSession));

export default userRouter;