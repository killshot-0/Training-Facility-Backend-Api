import express from "express";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import facilitiesRouter from "./routes/facilities.routes.js";
import planRouter from "./routes/plan.routes.js";
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import paymentRouter from "./routes/payment.routes.js";


const app = express();


app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/plans", planRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/payment", paymentRouter);



export default app;