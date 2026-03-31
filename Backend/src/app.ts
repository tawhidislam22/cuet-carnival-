import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { eventsRouter } from "./modules/events/events.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});
