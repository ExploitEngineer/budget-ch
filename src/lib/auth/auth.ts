import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db/db";
import { createHub } from "@/lib/services/hub";
import * as schema from "@/db/schema";
import { createHubMember } from "../services/hub-member";
import { createAuthMiddleware, APIError } from "better-auth/api";

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
    after: createAuthMiddleware(async (ctx) => {
      if(ctx.path.startsWith("/sign-up")) { // access .body to get the user data
        
      }else if(ctx.path.startsWith("/sign-in")) { // access .body to get the user data
        // Add any additional logic that should run after sign in
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const result = await createHub(user.id, user.name);
            if (result.status === "error") {
              console.error(result.message);
              return;
            }

            const { message, status } = await createHubMember({
              userId: user.id,
              hubId: result.data?.hubId!,
              accessRole: "member",
              isOwner: true,
              userName: user.name,
            });

            if (status === "error") {
              console.error(message);
            }

            // TODO: Create stripe customer for user
          } catch (err) {
            if (err instanceof Error) {
              console.error(`Error: ${err.message}`);
            }
          }
        },
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
