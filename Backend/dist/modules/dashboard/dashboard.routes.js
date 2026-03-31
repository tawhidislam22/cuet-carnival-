import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { getCertificatesController, getDashboardOverviewController, getMyEventsController, getScheduleController, } from "./dashboard.controller.js";
const router = Router();
router.get("/overview", requireAuth, getDashboardOverviewController);
router.get("/my-events", requireAuth, getMyEventsController);
router.get("/schedule", requireAuth, getScheduleController);
router.get("/certificates", requireAuth, getCertificatesController);
export const dashboardRouter = router;
