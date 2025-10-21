import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/lib/generated/prisma";
import { getEmailVerificationTemplate, getPasswordResetTemplate, getWelcomeEmailTemplate } from "@/lib/email-templates";

const prisma = new PrismaClient();

export const auth = betterAuth({
  trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL as string, "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    debugLogs: false,
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const template = getEmailVerificationTemplate("Verify your email address", url);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
    afterEmailVerification: async (user) => {
      // Send welcome email after successful email verification
      const template = getWelcomeEmailTemplate(user.name || "there");
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
  },
  emailAndPassword: {
    requireEmailVerification: true,

    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const template = getPasswordResetTemplate("Reset your password", url);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});



async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Implement your email sending logic here
  // Using fetch api /api/send-email

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
    }),
  });

  console.log("Email sent:", res.ok);
  return res.ok;
}


export async function sendWelcomeEmail({
  to,
  name
}: {
  to: string;
  name: string;
}) {


  const template = getWelcomeEmailTemplate(name);

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject: template.subject,
      html: template.html,
    }),
  });

  console.log("Email sent:", res.ok);
  return res.ok;
}
