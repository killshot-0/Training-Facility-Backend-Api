import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { idSchema } from "../schemas/facility.schemas.js";
import * as controllers from '../controllers/facility.controller.js';

const facilitiesRouter = Router();

facilitiesRouter.get("/", controllers.getFacilities);
facilitiesRouter.get("/:id", validate(idSchema), controllers.getFacilities);

export default facilitiesRouter;