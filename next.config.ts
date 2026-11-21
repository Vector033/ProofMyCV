import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page under /app is per-user and reads the session, so Cache
  // Components would add Suspense plumbing without caching anything useful.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  // Resume import posts a file of up to 2 MB (checked again in the action); the default cap is 1 MB.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  // The app was called FactFit; its old address keeps working by sending people to the new one.
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "factfit-five.vercel.app" }], destination: "https://proofmycv.vercel.app/:path*", permanent: true }];
  },
};

export default nextConfig;
