// We use a hardcoded config approach instead of environment variables
// based on whether the app is running in production or development.

// For other developers: Update the dev URLs below with your own Convex deployment.
// Run `npx convex dev` to get your local dev deployment URL.
const isProduction = import.meta.env.PROD;

export const env = {
  VITE_CONVEX_URL: isProduction
    ? "https://valiant-kiwi-952.convex.cloud" // Prod deployment
    : "https://judicious-bullfrog-896.convex.cloud", // Dev deployment - change to your own
  VITE_CONVEX_SITE_URL: isProduction
    ? "https://valiant-kiwi-952.convex.site" // Prod deployment
    : "https://judicious-bullfrog-896.convex.site", // Dev deployment - change to your own
};
