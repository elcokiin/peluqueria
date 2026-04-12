import { z } from "zod";

const envSchema = z.object({
  VITE_CONVEX_URL: z.string().url(),
  VITE_CONVEX_SITE_URL: z.string().url(),
});

// Use import.meta.env properties explicitly for client, and fallback to process.env for server runtime variables
const parsedEnv = envSchema.safeParse({
  VITE_CONVEX_URL: typeof process !== "undefined" && process.env.VITE_CONVEX_URL ? process.env.VITE_CONVEX_URL : import.meta.env.VITE_CONVEX_URL,
  VITE_CONVEX_SITE_URL: typeof process !== "undefined" && process.env.VITE_CONVEX_SITE_URL ? process.env.VITE_CONVEX_SITE_URL : import.meta.env.VITE_CONVEX_SITE_URL,
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
