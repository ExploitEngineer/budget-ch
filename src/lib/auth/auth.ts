import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db/db";
import { CreateHub } from "@/lib/services/hub";
import * as schema from "@/db/schema";
import { CreateHubMember } from "../services/hub-member";

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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const result = await CreateHub(user.id, user.name);
            if (result.status === "error") {
              console.error(result.message);
              return;
            }

            const { message, status } = await CreateHubMember({
              userId: user.id,
              hubId: result.data?.hubId!,
              accessRole: "member",
              isOwner: true,
              userName: user.name,
            });

            if (status === "error") {
              console.error(message);
            }
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
