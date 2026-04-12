import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [
    getAuthConfigProvider(),
    {
      domain: "https://barberstudio-bm.vercel.app",
      applicationID: "convex",
    },
    {
      domain: "https://barberstudio.jdevs.me",
      applicationID: "convex",
    },
    {
      domain: "http://localhost:3001",
      applicationID: "convex",
    }
  ],
} satisfies AuthConfig;
