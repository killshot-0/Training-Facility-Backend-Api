import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { userRequestSchema } from "../schemas/ai.schemas.js";
import * as controllers from '../controllers/ai.controller.js';
import { asyncHandler } from "../utils/async-handler.js";

const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post("/support", validate(userRequestSchema), asyncHandler(controllers.askModel));


export default aiRouter;