import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Allow the desktop app to call these endpoints cross-origin.
    // Set ALLOWED_ORIGIN to the exact desktop app URL in production.
    const origin = process.env.ALLOWED_ORIGIN ?? "*";
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: origin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Admin-Secret" },
        ],
      },
    ];
  },
};

export default nextConfig;
