import type { Request } from "express";

export function toWebHeaders(req: Request): Headers {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
      return;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  });

  return headers;
}
