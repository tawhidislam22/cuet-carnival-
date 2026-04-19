import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import {
  getAdminEventsController,
  getAdminOverviewController,
  getAdminReportsController,
  getAdminUsersController,
	getCertificatesController,
	getDashboardOverviewController,
	getMyEventsController,
	getScheduleController,
  adminToggleEventPublishController,
  adminDeleteEventController,
  adminGetEventRegistrationsController,
  adminSuspendUserController,
  adminDeleteUserController,
  adminChangeUserRoleController,
  adminUpdateEventSettingsController,
} from "./dashboard.controller.js";

const router = Router();

router.get("/overview", requireAuth, getDashboardOverviewController);
router.get("/my-events", requireAuth, getMyEventsController);
router.get("/schedule", requireAuth, getScheduleController);
router.get("/certificates", requireAuth, getCertificatesController);
router.get("/admin/overview", requireAuth, getAdminOverviewController);
router.get("/admin/events", requireAuth, getAdminEventsController);
router.get("/admin/users", requireAuth, getAdminUsersController);
router.get("/admin/reports", requireAuth, getAdminReportsController);

// Admin event actions
router.patch("/admin/events/:id/toggle-publish", requireAuth, adminToggleEventPublishController);
router.delete("/admin/events/:id", requireAuth, adminDeleteEventController);
router.get("/admin/events/:id/registrations", requireAuth, adminGetEventRegistrationsController);

// Admin user actions
router.patch("/admin/users/:id/suspend", requireAuth, adminSuspendUserController);
router.delete("/admin/users/:id", requireAuth, adminDeleteUserController);
router.patch("/admin/users/:id/role", requireAuth, adminChangeUserRoleController);

// Admin settings
router.patch("/admin/settings", requireAuth, adminUpdateEventSettingsController);

export const dashboardRouter = router;
