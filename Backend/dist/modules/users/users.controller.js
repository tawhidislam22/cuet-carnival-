import { getCurrentUser } from "./users.service.js";
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
