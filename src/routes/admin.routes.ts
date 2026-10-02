import { Router } from "express";

const adminRouter = Router();

adminRouter.get("/users");
adminRouter.get("/users/:id");
adminRouter.patch("/users/:id");
adminRouter.patch("/users/:id/role");
adminRouter.delete("/users/:id");

adminRouter.get("/plan/users");
adminRouter.patch("/plan/:id");
adminRouter.delete("/plan/:id");

adminRouter.delete("/facilities/:id");

adminRouter.get("/role/users");

adminRouter.get("/subscriptions/");
adminRouter.get("/subscriptions/:id");
adminRouter.get("/subscriptions/users");
adminRouter.patch("/subscriptions/:id");
adminRouter.delete("/subscriptions/:id");

adminRouter.get("/payments");
adminRouter.get("/payments/:id");
adminRouter.patch("/payments/:id");
adminRouter.delete("/payments/:id");

adminRouter.get("/sessions");
adminRouter.get("/sessions/:id");
adminRouter.patch("/sessions/:id");
adminRouter.delete("/sessions/:id");


adminRouter.get("/analytics");

adminRouter.post("/logout-all");

export default adminRouter;