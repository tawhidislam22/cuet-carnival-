import { prisma } from "../../config/prisma.js";
function isTransientPrismaConnectionError(error) {
    if (typeof error !== "object" || error === null || !("code" in error)) {
        return false;
    }
    const code = error.code;
    return code === "P1001" || code === "P1002";
}
async function withReadRetry(operation, retries = 2) {
    let attempt = 0;
    while (true) {
        try {
            return await operation();
        }
        catch (error) {
            if (!isTransientPrismaConnectionError(error) || attempt >= retries) {
                throw error;
            }
            attempt += 1;
            const waitMs = attempt * 800;
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
    }
}
export async function listEvents() {
    const events = await withReadRetry(() => prisma.event.findMany({
        where: { isPublished: true },
        orderBy: { startsAt: "asc" },
        include: {
            organizer: {
                select: { id: true, name: true, email: true },
            },
            _count: {
                select: { registrations: true },
            },
        },
    }));
    return events.map((event) => ({
        ...event,
        attendees: event._count.registrations,
    }));
}
export async function listOrganizerEvents(organizerId) {
    const events = await withReadRetry(() => prisma.event.findMany({
        where: { organizerId },
        orderBy: { startsAt: "asc" },
        include: {
            _count: {
                select: { registrations: true },
            },
        },
    }));
    return events.map((event) => ({
        ...event,
        attendees: event._count.registrations,
    }));
}
export async function getEventById(id) {
    const event = await withReadRetry(() => prisma.event.findUnique({
        where: { id },
        include: {
            organizer: {
                select: { id: true, name: true, email: true },
            },
            _count: {
                select: { registrations: true },
            },
        },
    }));
    if (!event) {
        return null;
    }
    return {
        ...event,
        attendees: event._count.registrations,
    };
}
export async function createEvent(input, organizerId) {
    return prisma.event.create({
        data: {
            ...input,
            category: input.category,
            organizerId,
        },
    });
}
export async function updateEvent(id, input, userId) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
        return null;
    }
    if (event.organizerId !== userId) {
        throw new Error("FORBIDDEN");
    }
    return prisma.event.update({
        where: { id },
        data: input,
    });
}
export async function deleteEvent(id, userId) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
        return null;
    }
    if (event.organizerId !== userId) {
        throw new Error("FORBIDDEN");
    }
    return prisma.event.delete({ where: { id } });
}
export async function registerForEvent(eventId, userId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            _count: {
                select: { registrations: true },
            },
        },
    });
    if (!event || !event.isPublished) {
        throw new Error("NOT_FOUND");
    }
    if (event._count.registrations >= event.capacity) {
        throw new Error("FULL");
    }
    try {
        const registration = await prisma.eventRegistration.create({
            data: {
                eventId,
                userId,
                status: "Confirmed",
            },
        });
        return registration;
    }
    catch {
        throw new Error("ALREADY_REGISTERED");
    }
}
