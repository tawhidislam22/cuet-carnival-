import type { Request, Response } from "express";
import {
  getCertificatesByUserId,
  getDashboardOverviewByUserId,
  getMyEventsByUserId,
  getScheduleByUserId,
} from "./dashboard.service.js";

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
