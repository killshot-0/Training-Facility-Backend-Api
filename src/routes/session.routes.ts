import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permission } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    sessionQuery1Schema,
    sessionCreate1Schema
} from "../schemas/session.schemas.js";
import * as controllers from '../controllers/session.controller.js';
import { asyncHandler } from "../utils/async-handler.js";


const sessionRouter = Router();

sessionRouter.use(authenticate);

sessionRouter.get("/", permission("session:read:any"), validate(sessionQuery1Schema), asyncHandler(controllers.getSessions));  //get sessions with query options
sessionRouter.get("/:id", permission("session:read:any"), validate(idSchema), asyncHandler(controllers.getSessions));   //get a specific session

sessionRouter.post("/", permission("session:create:any"), validate(sessionCreate1Schema), asyncHandler(controllers.createSession));  //create a session

sessionRouter.patch("/:id", permission("session:update:any"), validate(idSchema), asyncHandler(controllers.checkoutSession));   //checkout a session


export default sessionRouter;