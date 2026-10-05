import express from "express";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import facilitiesRouter from "./routes/facilities.routes.js";
import planRouter from "./routes/plan.routes.js";
import userRouter from "./routes/user.routes.js";


const app = express();


app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/plans", planRouter);
app.use("/api/facilities", facilitiesRouter);



export default app;