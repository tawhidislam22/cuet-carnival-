import { prisma } from "../../config/prisma.js";
// ---------- Faculties ----------
export async function listFaculties() {
    return prisma.faculty.findMany({
        orderBy: { name: "asc" },
        include: {
            categories: { orderBy: { name: "asc" } },
            venues: { orderBy: { name: "asc" } },
        },
    });
}
export async function createFaculty(name) {
    return prisma.faculty.create({ data: { name: name.trim() } });
}
export async function deleteFaculty(id) {
    return prisma.faculty.delete({ where: { id } });
}
// ---------- Categories ----------
export async function addCategory(facultyId, name) {
    // Ensure faculty exists
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty)
        throw Object.assign(new Error("Faculty not found"), { status: 404 });
    return prisma.eventCategory.create({ data: { name: name.trim(), facultyId } });
}
export async function deleteCategory(categoryId) {
    return prisma.eventCategory.delete({ where: { id: categoryId } });
}
// ---------- Venues ----------
export async function addVenue(facultyId, name) {
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty)
        throw Object.assign(new Error("Faculty not found"), { status: 404 });
    return prisma.venue.create({ data: { name: name.trim(), facultyId } });
}
export async function deleteVenue(venueId) {
    return prisma.venue.delete({ where: { id: venueId } });
}
