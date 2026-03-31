const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const AUTH_BASE_URL = apiUrl.replace(/\/api\/?$/, "");
