import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import {
  listOrganizersController,
	meController,
	updateOrganizerOnboardingController,
} from "./users.controller.js";

const router = Router();

router.get("/me", requireAuth, meController);
router.get("/organizers", requireAuth, listOrganizersController);
router.patch("/me/onboarding", requireAuth, updateOrganizerOnboardingController);

export const usersRouter = router;
