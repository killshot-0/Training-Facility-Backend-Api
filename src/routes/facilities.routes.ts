import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { idSchema } from "../schemas/facility.schemas.js";
import * as controllers from '../controllers/facility.controller.js';
import { asyncHandler } from "../utils/async-handler.js";

const facilitiesRouter = Router();

facilitiesRouter.use(authenticate);

facilitiesRouter.get("/", asyncHandler(controllers.getFacilities));
facilitiesRouter.get("/:id", validate(idSchema), asyncHandler(controllers.getFacilities));

export default facilitiesRouter;