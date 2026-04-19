import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

const CUET_EMAIL_PATTERN = /^u\d+@student\.cuet\.ac\.bd$/i;

type Transporter = {
  sendMail: (mail: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) => Promise<unknown>;
};

type NodemailerLike = {
  createTransport: (options: {
    host: string;
    port: number;
    secure: boolean;
    requireTLS?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }) => Transporter;
};

type SmtpError = {
  code?: string;
  responseCode?: number;
  message?: string;
  response?: string;
};

let hasLoggedGmailPasswordFormatWarning = false;

const isGmailHost = (host: string): boolean => {
  const normalized = host.trim().toLowerCase();
  return normalized === "smtp.gmail.com" || normalized.endsWith(".gmail.com") || normalized.includes("googlemail.com");
};

const normalizeSmtpPassword = (password: string, host: string): string => {
  const trimmed = password.trim();
  if (isGmailHost(host)) {
    // Google App Passwords can be copied with separators (spaces/hyphens).
    return trimmed.replace(/[^a-zA-Z0-9]/g, "");
  }

  return trimmed;
};

const isSmtpError = (error: unknown): error is SmtpError => {
  return Boolean(error) && typeof error === "object";
};

const getSmtpTransporter = async (): Promise<Transporter | null> => {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USER ||
    !env.SMTP_PASS ||
    !env.SMTP_FROM_EMAIL
  ) {
    return null;
  }

  const nodemailerModule = await import("nodemailer").catch(() => null);
  if (!nodemailerModule) {
    throw new Error(
      "SMTP is configured but 'nodemailer' is not installed. Run: npm install nodemailer @types/nodemailer"
    );
  }

  const nodemailer =
    (nodemailerModule as { default?: NodemailerLike }).default ??
    (nodemailerModule as NodemailerLike);

  const smtpHost = env.SMTP_HOST.trim();
  const smtpPort = env.SMTP_PORT;
  const smtpUser = env.SMTP_USER.trim();
  const smtpPass = normalizeSmtpPassword(env.SMTP_PASS, smtpHost);

  if (isGmailHost(smtpHost) && smtpPass.length !== 16 && !hasLoggedGmailPasswordFormatWarning) {
    hasLoggedGmailPasswordFormatWarning = true;
    console.error(
      `[auth] SMTP_PASS looks invalid for Gmail (normalized length: ${smtpPass.length}). Gmail App Password should be 16 characters.`
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendMailWithSmtp = async (mail: {
  to: string;
  subject: string;
  html: string;
}) => {
  const transporter = await getSmtpTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM_EMAIL!.trim(),
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
    });
  } catch (error) {
    if (isSmtpError(error) && error.code === "EAUTH") {
      if (env.SMTP_HOST && isGmailHost(env.SMTP_HOST) && error.responseCode === 535) {
        console.error(
          "[auth] Gmail SMTP rejected credentials (535). Use a Google App Password (16 chars), not your account password."
        );
        console.error("[auth] Enable 2-Step Verification, generate an App Password, then set SMTP_PASS to that value.");
        console.error("[auth] If copied as grouped text (e.g. xxxx xxxx xxxx xxxx), spaces are stripped automatically.");
      } else {
        console.error(`[auth] SMTP authentication failed: ${error.message ?? "Unknown error"}`);
      }

      return false;
    }

    console.error("[auth] Failed to send SMTP email", error);
    return false;
  }

  return true;
};

const sendResetPasswordEmail = async (email: string, url: string) => {
  const sent = await sendMailWithSmtp({
    to: email,
    subject: "Reset your CUET Carnival password",
    html: `
      <p>Hello,</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${url}">${url}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  if (sent) {
    return;
  }

  // Fallback for local development when email provider is not configured.
  console.info(`[auth] Password reset requested for ${email}`);
  console.info(`[auth] Open this URL to continue reset: ${url}`);
};

const sendVerificationEmail = async (email: string, url: string) => {
  const sent = await sendMailWithSmtp({
    to: email,
    subject: "Verify your CUET Carnival account",
    html: `
      <p>Hello,</p>
      <p>Welcome to CUET Carnival. Please verify your email to activate your account.</p>
      <p><a href="${url}">${url}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });

  if (sent) {
    return;
  }

  // Fallback for local development when email provider is not configured.
  console.info(`[auth] Email verification requested for ${email}`);
  console.info(`[auth] Open this URL to verify account: ${url}`);
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CLIENT_ORIGIN],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!CUET_EMAIL_PATTERN.test(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Only CUET student emails (u{studentId}@student.cuet.ac.bd) are allowed to register.",
            });
          }
          return { data: user };
        },
      },
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      organizerClubName: {
        type: "string",
        required: false,
      },
      organizerBio: {
        type: "string",
        required: false,
      },
      organizerEventType: {
        type: "string",
        required: false,
      },
    },
  },
});
