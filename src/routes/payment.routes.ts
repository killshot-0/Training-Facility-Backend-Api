import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    paymentQuery1Schema,
    paymentChangeSchema
} from "../schemas/payment.schemas.js";
import * as controllers from '../controllers/payment.controller.js'

const paymentRouter = Router();

paymentRouter.get("/", validate(paymentQuery1Schema), controllers.getPayments);     //get payments with query options
paymentRouter.get("/:id", validate(idSchema), controllers.getPayments);  //get a specific payment

paymentRouter.patch("/:id/confirm");   //confirm the payment receipt uploaded by the user
paymentRouter.patch("/:id", validate(paymentChangeSchema), controllers.changePaymentStatus);    //change the status of a user's payment

//POST already made along the subscription POST

paymentRouter.delete("/:id", validate(idSchema), controllers.deletePayment);  //delete a payment record (ADMIN only)


export default paymentRouter;