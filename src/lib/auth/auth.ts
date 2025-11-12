import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db/db";
import * as schema from "@/db/schema";
import { createAuthMiddleware, APIError } from "better-auth/api";
import {
  ensureUserOnboarding,
} from "@/lib/services/user";

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

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
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
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        // access .body to get the user data
        const user = ctx.context.newSession?.user;

        if (!user) {
          console.error("hook-after-sign-up: user not found in new session");
          return;
        }

        try {
          // Create user onboarding (handles Stripe + DB operations)
          const result = await ensureUserOnboarding(
            user.email,
          );

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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {},
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: true,
  },
  emailVerification: {
    // TODO: Add the email verification page
    sendVerificationEmail: async ({ user, url, token }, request) => {
      console.log(`EmailVerification: ${user.email} ${url} ${token}`);
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
