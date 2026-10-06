import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { 
    idSchema,
    sessionQuery1Schema,
    sessionCreate1Schema
} from "../schemas/session.schemas.js";
import * as controllers from '../controllers/session.controller.js';

const sessionRouter = Router();

sessionRouter.get("/", validate(sessionQuery1Schema), controllers.getSessions);  //get sessions with query options
sessionRouter.get("/:id", validate(idSchema), controllers.getSessions);   //get a specific session

sessionRouter.post("/", validate(sessionCreate1Schema), controllers.createSession);  //create a session

sessionRouter.patch("/:id", validate(idSchema), controllers.checkoutSession);   //checkout a session

sessionRouter.delete("/:id", validate(idSchema), controllers.deleteSession);  //delete a session (ADMIN only)


export default sessionRouter;