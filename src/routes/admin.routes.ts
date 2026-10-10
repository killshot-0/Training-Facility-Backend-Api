import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import * as controllers from '../controllers/admin.controller.js';
import { 
    idSchema, 
    roleChangeSchema, 
    planCreateSchema , 
    planSchema, 
    facilityCreateSchema, 
    getByRoleSchema,
    subscriptionSchema,
    paymentSchema,
    sessionSchema
} from "../schemas/admin.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { permission } from "../middlewares/permission.middleware.js";

const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get("/users", permission("absolute"), asyncHandler(controllers.getUsers));        //get users
adminRouter.get("/users/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.getUsers));    //get a specific user
adminRouter.patch("/users/:id/role", permission("absolute"), validate(roleChangeSchema), asyncHandler(controllers.changeRole));   //change a users role
adminRouter.delete("/users/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.deleteUser));      //delete a user


adminRouter.post("/plan", permission("absolute"), validate(planCreateSchema), asyncHandler(controllers.createPlan));         //add a new plan 
adminRouter.patch("/plan/:id", permission("absolute"), validate(planSchema.priceChangeSchema), asyncHandler(controllers.planControllers.changePlanPrice));   //change the price of plan with membership
adminRouter.delete("/plan/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.deletePlan));   //delete a plan

adminRouter.get("/facilities/", permission("absolute"), asyncHandler(controllers.facilityControllers.getFacilities));      //get the available facilities 
adminRouter.get("/facilities/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.facilityControllers.getFacilities));   //get a specific facility  
adminRouter.post("/facilities/", permission("absolute"), validate(facilityCreateSchema), asyncHandler(controllers.createFacility));     //add a new facility  
adminRouter.delete("/facilities/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.deleteFacility));   //delete a facility

adminRouter.get("/role/users", permission("absolute"), validate(getByRoleSchema), asyncHandler(controllers.usersByRole));      //get the users that have a specific role

adminRouter.get("/subscriptions/", permission("absolute"), validate(subscriptionSchema.subscriptionQuery1Schema), asyncHandler(controllers.subscriptionControllers.getSubscription));    //get the subscription with query options
adminRouter.get("/subscriptions/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.subscriptionControllers.getSubscription));   //get a specific subscription
adminRouter.get("/subscriptions/users", permission("absolute"), asyncHandler(controllers.subscriptionControllers.UsersWithSubscriptions));  //get all the user with subscriptions along with the subscriptions
adminRouter.post("/subscriptions/", permission("absolute"), validate(subscriptionSchema.subscriptionCreate1Schema), asyncHandler(controllers.subscriptionControllers.createSubscription))
adminRouter.patch("/subscriptions/:id", permission("absolute"), validate(subscriptionSchema.subscriptionChangeSchema), asyncHandler(controllers.subscriptionControllers.changeSubscriptionStatus));    //change a subscription information
adminRouter.delete("/subscriptions/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.subscriptionControllers.deleteSubscription));   //delete a subscription

adminRouter.get("/payments", permission("absolute"), validate(paymentSchema.paymentQuery1Schema), asyncHandler(controllers.paymentControllers.getPayments));       //get all payments with query options
adminRouter.get("/payments/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.paymentControllers.getPayments));   //get a specific payment
adminRouter.get("/payments/:id/receipt", permission("absolute"), validate(idSchema), asyncHandler(controllers.paymentControllers.getReceipt));   //get the payment receipt of a payment
adminRouter.patch("/payments/:id", permission("absolute"), validate(paymentSchema.paymentChangeSchema), asyncHandler(controllers.paymentControllers.changePaymentStatus));    //change payment information
adminRouter.delete("/payments/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.paymentControllers.deletePayment));    //delete a payment

adminRouter.get("/sessions", permission("absolute"), validate(sessionSchema.sessionQuery1Schema), asyncHandler(controllers.sessionControllers.getSessions));       //get all sessions with query options
adminRouter.get("/sessions/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.sessionControllers.getSessions));   //get a specific session
adminRouter.post("/sessions/", permission("absolute"), validate(sessionSchema.sessionCreate1Schema), asyncHandler(controllers.sessionControllers.createSession));      //create a session
adminRouter.patch("/sessions/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.sessionControllers.checkoutSession));  //checkout a session
adminRouter.delete("/sessions/:id", permission("absolute"), validate(idSchema), asyncHandler(controllers.sessionControllers.deleteSession));    //delete a session


adminRouter.get("/analytics");  //get analytical information 

adminRouter.post("/logout-all", permission("absolute"), asyncHandler(controllers.authControllers.logoutAll));    //log out users

export default adminRouter;