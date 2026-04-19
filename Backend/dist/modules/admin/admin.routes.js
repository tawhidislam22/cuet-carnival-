import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { listFacultiesController, createFacultyController, deleteFacultyController, addCategoryController, deleteCategoryController, addVenueController, deleteVenueController, } from "./admin.controller.js";
export const adminRouter = Router();
// Public — used by create-event form to populate dropdowns
adminRouter.get("/faculties", listFacultiesController);
// Admin-only routes (role check inside controller)
adminRouter.post("/faculties", requireAuth, createFacultyController);
adminRouter.delete("/faculties/:id", requireAuth, deleteFacultyController);
adminRouter.post("/faculties/:id/categories", requireAuth, addCategoryController);
adminRouter.delete("/categories/:categoryId", requireAuth, deleteCategoryController);
adminRouter.post("/faculties/:id/venues", requireAuth, addVenueController);
adminRouter.delete("/venues/:venueId", requireAuth, deleteVenueController);
