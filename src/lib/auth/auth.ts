import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import db from "@/db/db";
import * as schema from "@/db/schema";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { ensureUserOnboarding } from "@/lib/services/user";
import { mailer } from "@/lib/mailer";
import { getMailTranslations } from "@/lib/mail-translations";



export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
      twoFactors: schema.twoFactor,
    },
  }),
  appName: "Budget-ch",
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
      // Handle both regular sign-up and OAuth callbacks (e.g., Google sign-in)
      const isSignUp = ctx.path.startsWith("/sign-up");
      const isOAuthCallback = ctx.path.startsWith("/callback");

      if (isSignUp || isOAuthCallback) {
        // access .body to get the user data
        const user = ctx.context.newSession?.user;

        if (!user) {
          // For OAuth, user might not be in newSession for returning users
          if (isSignUp) {
            console.error("hook-after-sign-up: user not found in new session");
          }
          return;
        }

        try {
          // Create user onboarding (handles Stripe + DB operations)
          // This is idempotent - won't duplicate if already onboarded
          const result = await ensureUserOnboarding(user.email);

          if (!result.success) {
            console.error(
              `Error completing user onboarding: ${result.message}`,
            );
            return;
          }

          console.log(
            `[${user.email}] ${result.message}`,
          );
        } catch (err) {
          if (err instanceof Error) {
            console.error(`Error in ${isOAuthCallback ? 'OAuth callback' : 'sign-up'} hook: ${err.message}`);
          }
        }
      }
      if (ctx.path.startsWith("/sign-out")) {
        // Clear activeHubId cookie server-side
        // Must match all options used when setting the cookie for proper deletion
        const isProduction = process.env.NODE_ENV === "production";
        const cookieValue = [
          "activeHubId=",
          "path=/",
          "expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "Max-Age=0",
          "HttpOnly",
          "SameSite=Lax",
          isProduction ? "Secure" : "",
        ].filter(Boolean).join("; ");
        ctx.setHeader("Set-Cookie", cookieValue);
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const locale = (user as any).language || "en";
      const t = await getMailTranslations(locale);
      const name = user.name || user.email;

      const html = `
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("emails.auth.reset-password.title")}</title>
  </head>
  <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
      <h2 style="text-align: center; color: #111;">${t("emails.auth.reset-password.title")}</h2>
      <p>${t("emails.auth.reset-password.hi", { name })}</p>
      <p>${t("emails.auth.reset-password.request")}</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${url}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${t("emails.auth.reset-password.button")}</a>
      </p>
      <p>${t("emails.auth.reset-password.fallback")}</p>
      <p style="color: #2563eb; word-break: break-all;">${url}</p>
      <p>${t("emails.auth.reset-password.expire")}</p>
      <p>${t("emails.auth.reset-password.ignore")}</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.reset-password.footer")}</p>
    </div>
  </body>
</html>
`;
      try {
        await mailer.sendMail({
          from: `"BudgetHub" <${process.env.MAIL_USER!}>`,
          to: user.email,
          subject: t("emails.auth.reset-password.subject"),
          html,
        });
      } catch (err) {
        console.error("Failed to send reset password email:", err);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true, // Automatically send verification email on signup
    sendVerificationEmail: async ({ user, url }) => {
      const locale = (user as any).language || "en";
      const t = await getMailTranslations(locale);
      const name = user.name || user.email;

      const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${t("emails.auth.verify-email.title")}</title>
        </head>
        <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
            <h2 style="text-align: center; color: #111;">${t("emails.auth.verify-email.title")}</h2>
            <p>${t("emails.auth.verify-email.hi")}</p>
            <p>${t("emails.auth.verify-email.thanks", { name })}</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${url}email-verified" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${t("emails.auth.verify-email.button")}</a>
            </p>
            <p>${t("emails.auth.verify-email.fallback")}</p>
            <p style="color: #2563eb; word-break: break-all;">${url}email-verified</p>
            <p>${t("emails.auth.verify-email.expire")}</p>
            <p>${t("emails.auth.verify-email.ignore")}</p>
            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
            <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.verify-email.footer")}</p>
          </div>
        </body>
      </html>
    `;

      try {
        await mailer.sendMail({
          from: `"BudgetHub" <${process.env.MAIL_USER!}>`,
          to: user.email,
          subject: t("emails.auth.verify-email.subject"),
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
  plugins: [
    twoFactor({
      issuer: "Budget-ch",
      /*
      backupCodeOptions: {
        length: 10,
        amount: 10,
      },
      */
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          const locale = (user as any).language || "en";
          const t = await getMailTranslations(locale);
          const name = user.name || user.email;

          const html = `
            <html>
              <head>
                <meta charset="UTF-8" />
                <title>${t("emails.auth.otp.title")}</title>
              </head>
              <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
                <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
                  <h2 style="text-align: center; color: #111;">${t("emails.auth.otp.title")}</h2>
                  <p>${t("emails.auth.otp.hi", { name })}</p>
                  <p>${t("emails.auth.otp.code-is")}</p>
                  <p style="text-align: center; margin: 32px 0;">
                    <span style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 4px;">${otp}</span>
                  </p>
                  <p>${t("emails.auth.otp.expire")}</p>
                  <p>${t("emails.auth.otp.ignore")}</p>
                  <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
                  <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.otp.footer")}</p>
                </div>
              </body>
            </html>
          `;
          try {
            await mailer.sendMail({
              from: `"BudgetHub" <${process.env.MAIL_USER!}>`,
              to: user.email,
              subject: t("emails.auth.otp.subject"),
              html,
            });
          } catch (err) {
            console.error("Failed to send OTP email:", err);
          }
        },
        period: 3, // 3 minutes (in minutes for OTP)
      },
    }),
  ],
});
