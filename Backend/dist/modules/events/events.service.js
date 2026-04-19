import { prisma } from "../../config/prisma.js";
function computeEventStatus(startsAt, endsAt) {
    const now = new Date();
    if (now < startsAt)
        return "Upcoming";
    if (now > endsAt)
        return "Completed";
    return "Ongoing";
}
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
        status: computeEventStatus(event.startsAt, event.endsAt),
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
        status: computeEventStatus(event.startsAt, event.endsAt),
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
        status: computeEventStatus(event.startsAt, event.endsAt),
        attendees: event._count.registrations,
    };
}
export async function createEvent(input, organizerId) {
    // Reject if another event at the same venue overlaps the requested time window
    const conflict = await prisma.event.findFirst({
        where: {
            location: { equals: input.location, mode: "insensitive" },
            startsAt: { lt: input.endsAt },
            endsAt: { gt: input.startsAt },
        },
    });
    if (conflict)
        throw new Error("VENUE_CONFLICT");
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
    // Reject edits on events that have already ended
    if (computeEventStatus(event.startsAt, event.endsAt) === "Completed") {
        throw new Error("EVENT_COMPLETED");
    }
    // Venue conflict check when location or times are changing
    const newLocation = input.location ?? event.location;
    const newStartsAt = input.startsAt ?? event.startsAt;
    const newEndsAt = input.endsAt ?? event.endsAt;
    const conflict = await prisma.event.findFirst({
        where: {
            id: { not: id },
            location: { equals: newLocation, mode: "insensitive" },
            startsAt: { lt: newEndsAt },
            endsAt: { gt: newStartsAt },
        },
    });
    if (conflict)
        throw new Error("VENUE_CONFLICT");
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
export async function listEventRegistrations(eventId, organizerId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        return null;
    if (event.organizerId !== organizerId)
        throw new Error("FORBIDDEN");
    return prisma.eventRegistration.findMany({
        where: { eventId },
        orderBy: { registeredAt: "asc" },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
    // certificateIssuedAt is a scalar field, returned automatically
}
export async function issueRegistrationCertificate(eventId, registrationId, organizerId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        return null;
    if (event.organizerId !== organizerId)
        throw new Error("FORBIDDEN");
    const reg = await prisma.eventRegistration.findFirst({
        where: { id: registrationId, eventId },
    });
    if (!reg)
        return null;
    return prisma.eventRegistration.update({
        where: { id: registrationId },
        data: { certificateIssuedAt: new Date() },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
}
export async function revokeRegistrationCertificate(eventId, registrationId, organizerId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        return null;
    if (event.organizerId !== organizerId)
        throw new Error("FORBIDDEN");
    const reg = await prisma.eventRegistration.findFirst({
        where: { id: registrationId, eventId },
    });
    if (!reg)
        return null;
    return prisma.eventRegistration.update({
        where: { id: registrationId },
        data: { certificateIssuedAt: null },
    });
}
export async function deleteEventRegistration(eventId, registrationId, organizerId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        return null;
    if (event.organizerId !== organizerId)
        throw new Error("FORBIDDEN");
    const reg = await prisma.eventRegistration.findFirst({
        where: { id: registrationId, eventId },
    });
    if (!reg)
        return null;
    return prisma.eventRegistration.delete({ where: { id: registrationId } });
}
export async function updateEventImage(eventId, imageUrl, organizerId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
        return null;
    if (event.organizerId !== organizerId)
        throw new Error("FORBIDDEN");
    return prisma.event.update({ where: { id: eventId }, data: { imageUrl } });
}
export async function registerForEvent(eventId, userId, input = {}) {
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
                studentId: input.studentId ?? null,
                department: input.department ?? null,
                hall: input.hall ?? null,
            },
        });
        return registration;
    }
    catch {
        throw new Error("ALREADY_REGISTERED");
    }
}
