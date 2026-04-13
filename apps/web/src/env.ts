// We use a hardcoded config approach instead of environment variables
// based on whether the app is running in production or development.

const isProduction = import.meta.env.PROD;

export const env = {
  VITE_CONVEX_URL: isProduction
    ? "https://rapid-caiman-847.convex.cloud" // Prod deployment
    : "https://rapid-caiman-847.convex.cloud", // Dev deployment
  VITE_CONVEX_SITE_URL: isProduction
    ? "https://rapid-caiman-847.convex.site" // Prod deployment
    : "https://rapid-caiman-847.convex.site", // Dev deployment
};
