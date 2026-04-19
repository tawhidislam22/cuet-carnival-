import { prisma } from "../../config/prisma.js";
export async function listOrganizers() {
    const organizers = await prisma.user.findMany({
        where: { role: "organizer" },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            organizerClubName: true,
            organizerBio: true,
            organizerEventType: true,
            onboardingCompleted: true,
            createdAt: true,
            events: {
                select: {
                    id: true,
                    _count: {
                        select: {
                            registrations: true,
                        },
                    },
                },
            },
        },
    });
    return organizers.map((organizer) => ({
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        organizerClubName: organizer.organizerClubName,
        organizerBio: organizer.organizerBio,
        organizerEventType: organizer.organizerEventType,
        onboardingCompleted: organizer.onboardingCompleted,
        createdAt: organizer.createdAt,
        hostedEvents: organizer.events.length,
        totalAttendees: organizer.events.reduce((sum, event) => sum + event._count.registrations, 0),
    }));
}
export async function getCurrentUser(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboardingCompleted: true,
            organizerClubName: true,
            organizerBio: true,
            organizerEventType: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
export async function updateOrganizerOnboarding(userId, input) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user) {
        return null;
    }
    if (user.role !== "organizer") {
        throw new Error("FORBIDDEN_ROLE");
    }
    return prisma.user.update({
        where: { id: userId },
        data: {
            organizerClubName: input.organizerClubName,
            organizerBio: input.organizerBio,
            organizerEventType: input.organizerEventType,
            onboardingCompleted: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboardingCompleted: true,
            organizerClubName: true,
            organizerBio: true,
            organizerEventType: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
