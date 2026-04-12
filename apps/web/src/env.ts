// We use a hardcoded config approach instead of environment variables
// based on whether the app is running in production or development.

const isProduction = import.meta.env.PROD || (typeof process !== "undefined" && process.env.NODE_ENV === "production");

export const env = {
  VITE_CONVEX_URL: isProduction
    ? "https://valiant-kiwi-952.convex.cloud" // Prod deployment
    : "https://judicious-bullfrog-896.convex.cloud", // Dev deployment
  VITE_CONVEX_SITE_URL: isProduction
    ? "https://valiant-kiwi-952.convex.site" // Prod deployment
    : "https://judicious-bullfrog-896.convex.site", // Dev deployment
};

