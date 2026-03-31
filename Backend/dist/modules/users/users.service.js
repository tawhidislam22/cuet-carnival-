import { prisma } from "../../config/prisma.js";
export async function getCurrentUser(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
