import "express-async-errors";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./modules/auth/auth.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { eventsRouter } from "./modules/events/events.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// Serve uploaded event images as static files (local dev only)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = process.env.VERCEL
  ? "/tmp/uploads"
  : path.resolve(__dirname, "../../public/uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth/*", toNodeHandler(auth));
app.use("/api/users", usersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;

  const prismaCode =
    typeof err === "object" && err !== null && "code" in err
      ? (err as { code?: string }).code
      : undefined;

  if (prismaCode === "P1001" || prismaCode === "P1002") {
    return res.status(503).json({
      message: "Database is temporarily unavailable or waking up. Please retry in a few seconds.",
    });
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});
