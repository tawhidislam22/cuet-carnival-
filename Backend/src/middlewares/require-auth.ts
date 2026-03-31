import type { NextFunction, Request, Response } from "express";
import { auth } from "../modules/auth/auth.js";
import { toWebHeaders } from "../utils/to-web-headers.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: toWebHeaders(req),
    });

    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.authUserId = session.user.id;
    req.authUserRole = (session.user as { role?: string }).role ?? "user";

    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
