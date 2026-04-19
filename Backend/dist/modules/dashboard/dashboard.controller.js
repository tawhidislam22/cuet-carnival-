import { getAdminEvents, getAdminOverview, getAdminReports, getAdminUsers, getCertificatesByUserId, getDashboardOverviewByUserId, getMyEventsByUserId, getScheduleByUserId, } from "./dashboard.service.js";
function ensureAdmin(req, res) {
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
export async function getDashboardOverviewController(req, res) {
    if (!req.authUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await getDashboardOverviewByUserId(req.authUserId);
    if (!data) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ data });
}
export async function getMyEventsController(req, res) {
    if (!req.authUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await getMyEventsByUserId(req.authUserId);
    return res.json({ data });
}
export async function getScheduleController(req, res) {
    if (!req.authUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await getScheduleByUserId(req.authUserId);
    return res.json({ data });
}
export async function getCertificatesController(req, res) {
    if (!req.authUserId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await getCertificatesByUserId(req.authUserId);
    return res.json({ data });
}
export async function getAdminOverviewController(req, res) {
    if (!ensureAdmin(req, res)) {
        return;
    }
    const data = await getAdminOverview();
    return res.json({ data });
}
export async function getAdminEventsController(req, res) {
    if (!ensureAdmin(req, res)) {
        return;
    }
    const data = await getAdminEvents();
    return res.json({ data });
}
export async function getAdminUsersController(req, res) {
    if (!ensureAdmin(req, res)) {
        return;
    }
    const data = await getAdminUsers();
    return res.json({ data });
}
export async function getAdminReportsController(req, res) {
    if (!ensureAdmin(req, res)) {
        return;
    }
    const data = await getAdminReports();
    return res.json({ data });
}
