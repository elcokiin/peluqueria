import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { createAuthMiddleware } from "better-auth/api";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [
      siteUrl,
      "http://localhost:3001",
      "https://barberstudio-bm.vercel.app",
      "https://barberstudio.jdevs.me"
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        accessType: "offline",
        prompt: "select_account consent",
      },
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
    hooks: {
      after: createAuthMiddleware(async (bCtx) => {
        // Check for both email sign-up and OAuth callback paths
        if (bCtx.path?.startsWith("/sign-up") || bCtx.path?.startsWith("/callback")) {
          const newSession = bCtx.context.newSession;
          
          if (newSession) {
            // Run the profile sync synchronously to ensure it completes before returning
            // Convex mutations are very fast, so this minimal blocking is preferred
            if ("runMutation" in ctx) {
              await (ctx as any).runMutation(internal.users.syncUserProfile, {
                authUserId: newSession.user.id,
                name: newSession.user.name,
                email: newSession.user.email,
              });
            }
          }
        }
      }),
    },
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
