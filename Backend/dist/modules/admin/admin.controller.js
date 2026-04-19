import { listFaculties, createFaculty, deleteFaculty, addCategory, deleteCategory, addVenue, deleteVenue, } from "./admin.service.js";
function requireAdmin(req, res) {
    if (req.authUserRole !== "admin") {
        res.status(403).json({ message: "Admin access required." });
        return false;
    }
    return true;
}
// GET /api/admin/faculties  — public (used by create-event form)
export async function listFacultiesController(req, res) {
    const data = await listFaculties();
    return res.json({ data });
}
// POST /api/admin/faculties
export async function createFacultyController(req, res) {
    if (!requireAdmin(req, res))
        return;
    const { name } = req.body;
    if (!name?.trim())
        return res.status(400).json({ message: "Faculty name is required." });
    try {
        const faculty = await createFaculty(name);
        return res.status(201).json({ data: faculty });
    }
    catch (err) {
        const code = err.code;
        if (code === "P2002")
            return res.status(409).json({ message: "Faculty already exists." });
        throw err;
    }
}
// DELETE /api/admin/faculties/:id
export async function deleteFacultyController(req, res) {
    if (!requireAdmin(req, res))
        return;
    try {
        await deleteFaculty(req.params.id);
        return res.status(204).send();
    }
    catch {
        return res.status(404).json({ message: "Faculty not found." });
    }
}
// POST /api/admin/faculties/:id/categories
export async function addCategoryController(req, res) {
    if (!requireAdmin(req, res))
        return;
    const { name } = req.body;
    if (!name?.trim())
        return res.status(400).json({ message: "Category name is required." });
    try {
        const category = await addCategory(req.params.id, name);
        return res.status(201).json({ data: category });
    }
    catch (err) {
        const code = err.code;
        const status = err.status;
        if (status === 404)
            return res.status(404).json({ message: "Faculty not found." });
        if (code === "P2002")
            return res.status(409).json({ message: "Category already exists in this faculty." });
        throw err;
    }
}
// DELETE /api/admin/categories/:categoryId
export async function deleteCategoryController(req, res) {
    if (!requireAdmin(req, res))
        return;
    try {
        await deleteCategory(req.params.categoryId);
        return res.status(204).send();
    }
    catch {
        return res.status(404).json({ message: "Category not found." });
    }
}
// POST /api/admin/faculties/:id/venues
export async function addVenueController(req, res) {
    if (!requireAdmin(req, res))
        return;
    const { name } = req.body;
    if (!name?.trim())
        return res.status(400).json({ message: "Venue name is required." });
    try {
        const venue = await addVenue(req.params.id, name);
        return res.status(201).json({ data: venue });
    }
    catch (err) {
        const code = err.code;
        const status = err.status;
        if (status === 404)
            return res.status(404).json({ message: "Faculty not found." });
        if (code === "P2002")
            return res.status(409).json({ message: "Venue already exists in this faculty." });
        throw err;
    }
}
// DELETE /api/admin/venues/:venueId
export async function deleteVenueController(req, res) {
    if (!requireAdmin(req, res))
        return;
    try {
        await deleteVenue(req.params.venueId);
        return res.status(204).send();
    }
    catch {
        return res.status(404).json({ message: "Venue not found." });
    }
}
