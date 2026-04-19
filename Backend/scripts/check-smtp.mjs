import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const envPath = path.resolve(process.cwd(), ".env");

if (!fs.existsSync(envPath)) {
  console.error("[smtp-check] .env file not found in Backend directory.");
  process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(envPath));

const host = (env.SMTP_HOST || "").trim();
const port = Number(env.SMTP_PORT || 0);
const user = (env.SMTP_USER || "").trim();
const from = (env.SMTP_FROM_EMAIL || "").trim();
const rawPass = (env.SMTP_PASS || "").trim();

if (!host || !port || !user || !from || !rawPass) {
  console.error("[smtp-check] SMTP config is incomplete.");
  console.error("[smtp-check] Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL");
  process.exit(1);
}

const isGmail = /gmail\.com|googlemail\.com/i.test(host);
const normalizedPass = isGmail
  ? rawPass.replace(/[^a-zA-Z0-9]/g, "")
  : rawPass;

console.log("[smtp-check] host:", host);
console.log("[smtp-check] port:", port);
console.log("[smtp-check] user:", user);
console.log("[smtp-check] from:", from);
console.log("[smtp-check] gmail mode:", isGmail ? "yes" : "no");
console.log("[smtp-check] normalized password length:", normalizedPass.length);

if (isGmail && normalizedPass.length !== 16) {
  console.error(
    "[smtp-check] Gmail App Password should be 16 characters after normalization."
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: port === 587,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user,
    pass: normalizedPass,
  },
});

try {
  await transporter.verify();
  console.log("[smtp-check] SMTP verification succeeded.");
  process.exit(0);
} catch (error) {
  const maybe = error && typeof error === "object" ? error : null;
  const code = maybe && "code" in maybe ? String(maybe.code) : "UNKNOWN";
  const responseCode =
    maybe && "responseCode" in maybe ? String(maybe.responseCode) : "UNKNOWN";

  console.error(`[smtp-check] SMTP verification failed: code=${code}, responseCode=${responseCode}`);

  if (isGmail && code === "EAUTH") {
    console.error(
      "[smtp-check] Gmail rejected credentials. Use a fresh App Password from the same Google account as SMTP_USER."
    );
  }

  process.exit(1);
}
