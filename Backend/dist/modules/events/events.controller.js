import { createEvent, deleteEvent, getEventById, listEvents, updateEvent, } from "./events.service.js";
import { createEventSchema, updateEventSchema } from "./events.schema.js";
export async function listEventsController(_req, res) {
    const events = await listEvents();
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
    const event = await createEvent(parsed.data, userId);
    return res.status(201).json({ data: event });
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
