import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { meController } from "./users.controller.js";

const router = Router();

router.get("/me", requireAuth, meController);

export const usersRouter = router;
