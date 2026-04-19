import { app } from "../src/app.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { IncomingMessage, ServerResponse } from "http";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as unknown as IncomingMessage, res as unknown as ServerResponse);
}
