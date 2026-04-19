import { z } from "zod";
import { getCurrentUser, listOrganizers, updateOrganizerOnboarding, } from "./users.service.js";
const organizerOnboardingSchema = z.object({
    organizerClubName: z.string().min(2).max(120),
    organizerBio: z.string().min(10).max(500),
    organizerEventType: z.string().min(2).max(80),
});
export async function meController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await getCurrentUser(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({ data: user });
}
export async function listOrganizersController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const organizers = await listOrganizers();
    return res.json({ data: organizers });
}
export async function updateOrganizerOnboardingController(req, res) {
    const userId = req.authUserId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const parsed = organizerOnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.flatten() });
    }
    try {
        const updatedUser = await updateOrganizerOnboarding(userId, parsed.data);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({ data: updatedUser });
    }
    catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN_ROLE") {
            return res.status(403).json({ message: "Only organizers can complete organizer onboarding" });
        }
        throw error;
    }
}
