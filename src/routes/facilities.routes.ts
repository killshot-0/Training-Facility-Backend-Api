import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permission } from "../middlewares/permission.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idSchema } from "../schemas/facility.schemas.js";
import * as controllers from '../controllers/facility.controller.js';
import { asyncHandler } from "../utils/async-handler.js";

const facilitiesRouter = Router();

facilitiesRouter.use(authenticate);

facilitiesRouter.get("/", permission("facilities:read:any"), asyncHandler(controllers.getFacilities));
facilitiesRouter.get("/:id", permission("facilities:read:any"), validate(idSchema), asyncHandler(controllers.getFacilities));

export default facilitiesRouter;