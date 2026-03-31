export function toWebHeaders(req) {
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
