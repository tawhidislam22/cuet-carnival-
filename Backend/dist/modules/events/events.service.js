import { prisma } from "../../config/prisma.js";
export async function listEvents() {
    const events = await prisma.event.findMany({
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
    });
    return events.map((event) => ({
        ...event,
        attendees: event._count.registrations,
    }));
}
export async function getEventById(id) {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            organizer: {
                select: { id: true, name: true, email: true },
            },
            _count: {
                select: { registrations: true },
            },
        },
    });
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
