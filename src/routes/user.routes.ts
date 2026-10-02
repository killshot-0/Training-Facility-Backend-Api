import { Router } from "express";

const userRouter = Router();

userRouter.get("/me");
userRouter.patch("/me");
userRouter.delete("/me");

userRouter.get("/subscription");
userRouter.post("/subscription");
userRouter.post("/subscription/:id/status");

userRouter.get("/payments");
userRouter.post("/payments");
userRouter.patch("/payments/:id");
userRouter.delete("/payments/:id");

userRouter.get("/sessions");
userRouter.post("/sessions");
userRouter.patch("/sessions/:id/checkout");
userRouter.delete("/sessions/:id");

export default userRouter;