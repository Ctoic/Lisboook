import type { NextConfig } from "next";

// Server-side base URL for the Nest API. 127.0.0.1 avoids Node resolving localhost to ::1,
// which the API (bound to 127.0.0.1) would refuse.
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3002/v1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a second dev server (e.g. for testing) build into its own folder instead of fighting over .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: ["@lisbook/ui", "@lisbook/types"],
  experimental: {
    // The /api/v1 rewrite gives up after 30s by default, which cuts off slower local-model answers
    // that arrive in one piece (e.g. Forge with Lis). Streamed answers start sooner and were never affected.
    proxyTimeout: 120_000
  },
  async rewrites() {
    // Browser calls go through /api/v1 so the web app never needs CORS access to the API.
    return [
      { source: "/api/v1/:path*", destination: `${apiBaseUrl}/:path*` },
      // Audio and cover files are served by the API; the player streams them through the same origin.
      { source: "/media/:path*", destination: `${new URL(apiBaseUrl).origin}/media/:path*` }
    ];
  }
};

export default nextConfig;
