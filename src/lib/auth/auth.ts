import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db/db";
import * as schema from "@/db/schema";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { ensureUserOnboarding } from "@/lib/services/user";
import { mailer } from "@/lib/mailer";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx): Promise<void> => {
      if (ctx.path.startsWith("/sign-in")) {
        // Get user from request body (before session is created)
        if (!ctx.request) {
          // If no request object, let the normal auth flow handle it
          return;
        }

        const body = await ctx.body; // .request.json().catch(() => ({}));
        const email = body.email as string | undefined;

        if (!email) {
          // If we can't get email, let the normal auth flow handle it
          return;
        }

        try {
          // Ensure user onboarding is complete (handles Stripe + DB operations)
          const result = await ensureUserOnboarding(email);

          if (!result.success) {
            // If user not found, let sign-in proceed (will fail if credentials are wrong)
            if (result.message === "User not found") {
              return;
            }

            // Otherwise, onboarding failed - prevent sign-in
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message:
                "Failed to setup your account. Please try signing in again.",
            });
          }
        } catch (err) {
          // If it's already an APIError, re-throw it
          if (err instanceof APIError) {
            throw err;
          }

          // For other errors, log and throw API error
          console.error(`Error ensuring user onboarding: ${err}`);
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message:
              "Failed to setup your account. Please try signing in again.",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx): Promise<void> => {
      if (ctx.path.startsWith("/sign-up")) {
        // access .body to get the user data
        const user = ctx.context.newSession?.user;

        if (!user) {
          console.error("hook-after-sign-up: user not found in new session");
          return;
        }

        try {
          // Create user onboarding (handles Stripe + DB operations)
          const result = await ensureUserOnboarding(user.email);

          if (!result.success) {
            console.error(
              `Error completing user onboarding: ${result.message}`,
            );
            return;
          }

          console.log(
            `User onboarding completed successfully for user: ${user.email}`,
          );
        } catch (err) {
          if (err instanceof Error) {
            console.error(`Error in sign-up hook: ${err.message}`);
          }
        }
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const html = `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password</title>
  </head>
  <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
      <h2 style="text-align: center; color: #111;">Reset Your Password</h2>
      <p>Hi ${user.name || user.email},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${url}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="color: #2563eb; word-break: break-all;">${url}</p>
      <p>This password reset link will expire in 24 hours.</p>
      <p>If you didn’t request a password reset, you can safely ignore this email.</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">© 2024 Your Company Name. All rights reserved.</p>
    </div>
  </body>
</html>
`;
      try {
        await mailer.sendMail({
          from: `"Budget-ch" <${process.env.MAIL_USER!}`,
          to: user.email,
          subject: "Reset Your Password",
          html,
        });
      } catch (err) {
        console.error("Failed to send reset password email:", err);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Verify your email</title>
        </head>
        <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
            <h2 style="text-align: center; color: #111;">Verify Your Email Address</h2>
            <p>Hi there!</p>
            <p>Thank you, ${user.name || user.email}, for signing up! To complete your registration, please verify your email by clicking the button below.</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${url}email-verified" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
            </p>
            <p>If the button doesn’t work, copy and paste this link into your browser:</p>
            <p style="color: #2563eb; word-break: break-all;">${url}email-verified</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn’t create an account, you can ignore this email.</p>
            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
            <p style="text-align: center; font-size: 12px; color: #666;">© 2025 Budget-ch. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

      try {
        await mailer.sendMail({
          from: `"Budget-ch" <${process.env.MAIL_USER!}>`,
          to: user.email,
          subject: "Verify your email address",
          html,
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
