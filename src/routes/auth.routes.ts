import { Router } from "express";

const authRouter = Router();


authRouter.post("/register");

authRouter.post("/login");

authRouter.post("/refresh");

authRouter.post("/logout");


export default authRouter;