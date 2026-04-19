import { auth } from "../modules/auth/auth.js";
import { prisma } from "../config/prisma.js";
import { toWebHeaders } from "../utils/to-web-headers.js";
export async function requireAuth(req, res, next) {
    try {
        const session = await auth.api.getSession({
            headers: toWebHeaders(req),
        });
        if (!session?.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const authUserId = session.user.id;
        if (!authUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: authUserId },
            select: { role: true },
        });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.authUserId = authUserId;
        req.authUserRole = user.role;
        return next();
    }
    catch {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
