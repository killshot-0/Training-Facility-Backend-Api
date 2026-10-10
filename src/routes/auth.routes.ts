import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import * as controllers from '../controllers/auth.controller.js';
import * as OControllers from '../controllers/oauth.controller.js';
import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";


const authRouter = Router();

authRouter.get("/google", asyncHandler(OControllers.googleLogin));

authRouter.get("/google/callback", asyncHandler(OControllers.callback));

authRouter.post("/register", validate(registerSchema), asyncHandler(controllers.registering));

authRouter.post("/login", validate(loginSchema), asyncHandler(controllers.loging));

authRouter.post("/refresh", asyncHandler(controllers.refresh));

authRouter.post("/logout", asyncHandler(controllers.logout));


export default authRouter;