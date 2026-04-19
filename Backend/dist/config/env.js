import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
dotenv.config();
// Fallback for monorepo/root starts where CWD is not Backend/
if (!process.env.BETTER_AUTH_SECRET || !process.env.DATABASE_URL) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, "../../.env");
    dotenv.config({ path: envPath });
}
const optionalString = z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().min(1).optional());
const optionalPort = z.preprocess((value) => {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value === "string" && value.trim() === "")
        return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().min(1).max(65535).optional());
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(16),
    PORT: z.coerce.number().default(5000),
    CLIENT_ORIGIN: z.string().url(),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    SMTP_HOST: optionalString,
    SMTP_PORT: optionalPort,
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    SMTP_FROM_EMAIL: optionalString,
}).superRefine((value, ctx) => {
    const hasGoogleClientId = Boolean(value.GOOGLE_CLIENT_ID);
    const hasGoogleClientSecret = Boolean(value.GOOGLE_CLIENT_SECRET);
    const hasSmtpConfig = [
        value.SMTP_HOST,
        value.SMTP_PORT,
        value.SMTP_USER,
        value.SMTP_PASS,
        value.SMTP_FROM_EMAIL,
    ].map(Boolean);
    if (hasGoogleClientId !== hasGoogleClientSecret) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be provided.",
            path: ["GOOGLE_CLIENT_ID"],
        });
    }
    if (hasSmtpConfig.some(Boolean) && !hasSmtpConfig.every(Boolean)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM_EMAIL must all be provided together.",
            path: ["SMTP_HOST"],
        });
    }
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = parsed.data;
