import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(16),
    PORT: z.coerce.number().default(5000),
    CLIENT_ORIGIN: z.string().url(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = parsed.data;
