import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
    idSchema,
    sessionQuery1Schema,
    sessionCreate1Schema
} from "../schemas/session.schemas.js";
import * as controllers from '../controllers/session.controller.js';
import { asyncHandler } from "../utils/async-handler.js";


const sessionRouter = Router();

sessionRouter.use(authenticate);

sessionRouter.get("/", validate(sessionQuery1Schema), asyncHandler(controllers.getSessions));  //get sessions with query options
sessionRouter.get("/:id", validate(idSchema), asyncHandler(controllers.getSessions));   //get a specific session

sessionRouter.post("/", validate(sessionCreate1Schema), asyncHandler(controllers.createSession));  //create a session

sessionRouter.patch("/:id", validate(idSchema), asyncHandler(controllers.checkoutSession));   //checkout a session

sessionRouter.delete("/:id", validate(idSchema), asyncHandler(controllers.deleteSession));  //delete a session (ADMIN only)


export default sessionRouter;