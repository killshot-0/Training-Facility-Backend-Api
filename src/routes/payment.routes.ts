import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permission } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    paymentQuery1Schema,
    paymentChangeSchema
} from "../schemas/payment.schemas.js";
import * as controllers from '../controllers/payment.controller.js';
import { asyncHandler } from "../utils/async-handler.js";


const paymentRouter = Router();

paymentRouter.use(authenticate);

paymentRouter.get("/", permission("payments:read:any"), validate(paymentQuery1Schema), asyncHandler(controllers.getPayments));     //get payments with query options
paymentRouter.get("/:id", permission("payments:read:any"), validate(idSchema), asyncHandler(controllers.getPayments));  //get a specific payment

//POST already made along the subscription POST

paymentRouter.get("/:id/receipt", permission("payments:read:any"), validate(idSchema), controllers.getReceipt);         //get the payment receipt of a payment
paymentRouter.patch("/:id", permission("payments:update:any"), validate(paymentChangeSchema), asyncHandler(controllers.changePaymentStatus));    //change the status of a user's payment


export default paymentRouter;