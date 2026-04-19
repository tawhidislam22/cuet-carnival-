import { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import {
  createEventController,
  deleteEventController,
  getEventController,
  listOrganizerEventsController,
  listEventsController,
  registerForEventController,
  updateEventController,
  listEventRegistrationsController,
  deleteEventRegistrationController,
  uploadEventImageController,
  eventImageUpload,
  issueCertificateController,
  revokeCertificateController,
} from "./events.controller.js";

const router = Router();

router.get("/", listEventsController);
router.get("/mine", requireAuth, listOrganizerEventsController);
router.get("/:id", getEventController);
router.get("/:id/registrations", requireAuth, listEventRegistrationsController);
router.post("/:id/register", requireAuth, registerForEventController);
router.post("/", requireAuth, createEventController);
router.patch("/:id", requireAuth, updateEventController);
router.post("/:id/image", requireAuth, eventImageUpload.single("image"), uploadEventImageController);
router.delete("/:id", requireAuth, deleteEventController);
router.delete("/:id/registrations/:registrationId", requireAuth, deleteEventRegistrationController);
router.post("/:id/registrations/:registrationId/certificate", requireAuth, issueCertificateController);
router.delete("/:id/registrations/:registrationId/certificate", requireAuth, revokeCertificateController);

export const eventsRouter = router;
