import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { createEvent, deleteEvent, getEventById, listOrganizerEvents, listEvents, registerForEvent, updateEvent, listEventRegistrations, deleteEventRegistration, updateEventImage, issueRegistrationCertificate, revokeRegistrationCertificate, } from "./events.service.js";
import { createEventSchema, updateEventSchema, registerForEventSchema } from "./events.schema.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../../../public/uploads/events");
if (!fs.existsSync(uploadsDir))
    fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
export const eventImageUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
export async function listEventsController(_req, res) {
    const events = await listEvents();
    return res.json({ data: events });
}
export async function listOrganizerEventsController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const events = await listOrganizerEvents(userId);
    return res.json({ data: events });
}
export async function getEventController(req, res) {
    const event = await getEventById(req.params.id);
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    return res.json({ data: event });
}
export async function createEventController(req, res) {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.flatten() });
    }
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const event = await createEvent(parsed.data, userId);
        return res.status(201).json({ data: event });
    }
    catch (error) {
        if (error instanceof Error && error.message === "VENUE_CONFLICT") {
            return res.status(409).json({
                message: "Another event is already scheduled at this venue during the selected time. Please choose a different time or venue.",
            });
        }
        throw error;
    }
}
export async function updateEventController(req, res) {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.flatten() });
    }
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const event = await updateEvent(req.params.id, parsed.data, userId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        return res.json({ data: event });
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (error instanceof Error && error.message === "VENUE_CONFLICT") {
            return res.status(409).json({
                message: "Another event is already scheduled at this venue during the selected time. Please choose a different time or venue.",
            });
        }
        if (error instanceof Error && error.message === "EVENT_COMPLETED") {
            return res.status(403).json({
                message: "This event has already ended and can no longer be edited.",
            });
        }
        throw error;
    }
}
export async function deleteEventController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const deleted = await deleteEvent(req.params.id, userId);
        if (!deleted) {
            return res.status(404).json({ message: "Event not found" });
        }
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function listEventRegistrationsController(req, res) {
    const userId = req.authUserId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const registrations = await listEventRegistrations(req.params.id, userId);
        if (registrations === null)
            return res.status(404).json({ message: "Event not found" });
        return res.json({ data: registrations });
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function deleteEventRegistrationController(req, res) {
    const userId = req.authUserId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const deleted = await deleteEventRegistration(req.params.id, req.params.registrationId, userId);
        if (deleted === null)
            return res.status(404).json({ message: "Not found" });
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function issueCertificateController(req, res) {
    const userId = req.authUserId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const result = await issueRegistrationCertificate(req.params.id, req.params.registrationId, userId);
        if (result === null)
            return res.status(404).json({ message: "Registration not found" });
        return res.json({ data: result });
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function revokeCertificateController(req, res) {
    const userId = req.authUserId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const result = await revokeRegistrationCertificate(req.params.id, req.params.registrationId, userId);
        if (result === null)
            return res.status(404).json({ message: "Registration not found" });
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function uploadEventImageController(req, res) {
    const userId = req.authUserId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (!req.file)
        return res.status(400).json({ message: "No image file provided" });
    // Build the public URL served by the backend
    const imageUrl = `/uploads/events/${req.file.filename}`;
    try {
        const event = await updateEventImage(req.params.id, imageUrl, userId);
        if (!event)
            return res.status(404).json({ message: "Event not found" });
        return res.json({ data: { imageUrl } });
    }
    catch (error) {
        // Clean up uploaded file on failure
        fs.unlink(req.file.path, () => { });
        if (error instanceof Error && error.message === "FORBIDDEN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        throw error;
    }
}
export async function registerForEventController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const parsed = registerForEventSchema.safeParse(req.body);
    const registrationInput = parsed.success ? parsed.data : {};
    try {
        const registration = await registerForEvent(req.params.id, userId, registrationInput);
        return res.status(201).json({ data: registration, message: "Registered successfully" });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "NOT_FOUND") {
                return res.status(404).json({ message: "Event not found" });
            }
            if (error.message === "FULL") {
                return res.status(409).json({ message: "Event is full" });
            }
            if (error.message === "ALREADY_REGISTERED") {
                return res.status(409).json({ message: "You are already registered for this event" });
            }
        }
        throw error;
    }
}
