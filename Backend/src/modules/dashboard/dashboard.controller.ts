import type { Request, Response } from "express";
import {
  getAdminEvents,
  getAdminOverview,
  getAdminReports,
  getAdminUsers,
  getCertificatesByUserId,
  getDashboardOverviewByUserId,
  getMyEventsByUserId,
  getScheduleByUserId,
  adminToggleEventPublish,
  adminDeleteEvent,
  adminGetEventRegistrations,
  adminSuspendUser,
  adminDeleteUser,
  adminChangeUserRole,
  adminUpdateEventSettings,
} from "./dashboard.service.js";

function ensureAdmin(req: Request, res: Response) {
  if (!req.authUserId) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }

  if (req.authUserRole !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }

  return true;
}

export async function getDashboardOverviewController(req: Request, res: Response) {
  if (!req.authUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = await getDashboardOverviewByUserId(req.authUserId);

  if (!data) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ data });
}

export async function getMyEventsController(req: Request, res: Response) {
  if (!req.authUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = await getMyEventsByUserId(req.authUserId);
  return res.json({ data });
}

export async function getScheduleController(req: Request, res: Response) {
  if (!req.authUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = await getScheduleByUserId(req.authUserId);
  return res.json({ data });
}

export async function getCertificatesController(req: Request, res: Response) {
  if (!req.authUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const data = await getCertificatesByUserId(req.authUserId);
  return res.json({ data });
}

export async function getAdminOverviewController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const data = await getAdminOverview();
  return res.json({ data });
}

export async function getAdminEventsController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const data = await getAdminEvents();
  return res.json({ data });
}

export async function getAdminUsersController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const data = await getAdminUsers();
  return res.json({ data });
}

export async function getAdminReportsController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) {
    return;
  }

  const data = await getAdminReports();
  return res.json({ data });
}

export async function adminToggleEventPublishController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const result = await adminToggleEventPublish(id);
  if (!result) return res.status(404).json({ message: "Event not found" });
  return res.json({ data: result, message: `Event ${result.isPublished ? "published" : "unpublished"}` });
}

export async function adminDeleteEventController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const result = await adminDeleteEvent(id);
  if (!result) return res.status(404).json({ message: "Event not found" });
  return res.status(204).send();
}

export async function adminGetEventRegistrationsController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const data = await adminGetEventRegistrations(id);
  return res.json({ data });
}

export async function adminSuspendUserController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const result = await adminSuspendUser(id);
  if (!result) return res.status(404).json({ message: "User not found" });
  return res.json({ data: result, message: `User ${result.emailVerified ? "activated" : "suspended"}` });
}

export async function adminDeleteUserController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const result = await adminDeleteUser(id);
  if (!result) return res.status(404).json({ message: "User not found" });
  return res.status(204).send();
}

export async function adminChangeUserRoleController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const { id } = req.params;
  const { role } = req.body as { role?: string };
  if (!role) return res.status(400).json({ message: "role is required" });
  try {
    const result = await adminChangeUserRole(id, role);
    if (!result) return res.status(404).json({ message: "User not found" });
    return res.json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ROLE") {
      return res.status(400).json({ message: "Invalid role" });
    }
    throw error;
  }
}

export async function adminUpdateEventSettingsController(req: Request, res: Response) {
  if (!ensureAdmin(req, res)) return;
  const result = await adminUpdateEventSettings(req.body as Record<string, unknown>);
  return res.json({ data: result });
}
