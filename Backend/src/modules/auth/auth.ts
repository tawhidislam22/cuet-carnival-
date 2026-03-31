import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

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
    auth: {
      user: string;
      pass: string;
    };
  }) => Transporter;
};

const sendResetPasswordEmail = async (email: string, url: string) => {
  if (
    env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.SMTP_FROM_EMAIL
  ) {
    const nodemailerModule = await (0, eval)("import('nodemailer')").catch(() => null);
    if (!nodemailerModule) {
      throw new Error(
        "SMTP is configured but 'nodemailer' is not installed. Run: npm install nodemailer @types/nodemailer"
      );
    }

    const nodemailer =
      (nodemailerModule as { default?: NodemailerLike }).default ??
      (nodemailerModule as NodemailerLike);

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: env.SMTP_FROM_EMAIL,
      to: email,
      subject: "Reset your CUET Carnival password",
      html: `
        <p>Hello,</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}">${url}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return;
  }

  // Fallback for local development when email provider is not configured.
  console.info(`[auth] Password reset requested for ${email}`);
  console.info(`[auth] Open this URL to continue reset: ${url}`);
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CLIENT_ORIGIN],
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
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
});
