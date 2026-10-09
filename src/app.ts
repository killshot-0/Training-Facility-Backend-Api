import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import helmet from "helmet";
import { env } from "./config/env.js";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import facilitiesRouter from "./routes/facilities.routes.js";
import planRouter from "./routes/plan.routes.js";
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import aiRouter from "./routes/ai.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";



const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Autherization"]
    })
);

app.use(express.json({limit: "20kb"}));

app.use(cookieParser(env.COOKIE_SECRET));

app.get("health", (req, res) => {
    res.status(200).json({status: "ok"});
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/plans", planRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/ai", aiRouter);

app.use(errorHandler);

export default app;