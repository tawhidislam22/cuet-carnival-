import { prisma } from "../../config/prisma.js";
export async function getDashboardOverviewByUserId(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            department: true,
        },
    });
    if (!user) {
        return null;
    }
    const registrations = await prisma.eventRegistration.findMany({
        where: { userId: user.id },
        include: {
            event: true,
        },
        orderBy: {
            event: {
                startsAt: "asc",
            },
        },
    });
    const now = new Date();
    const registeredEvents = registrations.map((registration) => ({
        id: registration.event.id,
        title: registration.event.title,
        location: registration.event.location,
        startsAt: registration.event.startsAt,
        endsAt: registration.event.endsAt,
        status: registration.status,
        imageUrl: registration.event.imageUrl,
    }));
    const stats = {
        eventsRegistered: registrations.length,
        eventsAttended: registrations.filter((registration) => registration.event.endsAt < now).length,
        upcomingEvents: registrations.filter((registration) => registration.event.startsAt > now).length,
    };
    return {
        user,
        stats,
        registeredEvents,
    };
}
export async function getMyEventsByUserId(userId) {
    const registrations = await prisma.eventRegistration.findMany({
        where: { userId },
        include: { event: true },
        orderBy: {
            event: {
                startsAt: "asc",
            },
        },
    });
    return registrations.map((registration) => ({
        id: registration.event.id,
        title: registration.event.title,
        description: registration.event.description,
        location: registration.event.location,
        startsAt: registration.event.startsAt,
        endsAt: registration.event.endsAt,
        imageUrl: registration.event.imageUrl,
        category: registration.event.category,
        status: registration.status,
        eventStatus: registration.event.status,
    }));
}
export async function getScheduleByUserId(userId) {
    const now = new Date();
    const registrations = await prisma.eventRegistration.findMany({
        where: {
            userId,
            event: {
                startsAt: {
                    gte: now,
                },
            },
        },
        include: { event: true },
        orderBy: {
            event: {
                startsAt: "asc",
            },
        },
    });
    return registrations.map((registration) => ({
        id: registration.event.id,
        title: registration.event.title,
        location: registration.event.location,
        startsAt: registration.event.startsAt,
        endsAt: registration.event.endsAt,
        category: registration.event.category,
        registrationStatus: registration.status,
    }));
}
export async function getCertificatesByUserId(userId) {
    const now = new Date();
    const registrations = await prisma.eventRegistration.findMany({
        where: {
            userId,
            status: "Confirmed",
            event: {
                endsAt: {
                    lt: now,
                },
            },
        },
        include: { event: true },
        orderBy: {
            event: {
                endsAt: "desc",
            },
        },
    });
    return registrations.map((registration) => ({
        id: registration.id,
        eventId: registration.event.id,
        eventTitle: registration.event.title,
        category: registration.event.category,
        completedAt: registration.event.endsAt,
        certificateCode: `CERT-${registration.event.id.slice(0, 8).toUpperCase()}`,
    }));
}
