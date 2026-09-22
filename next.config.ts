import type { NextConfig } from "next";

const bunnyHost = process.env.BUNNY_PULL_ZONE_URL
  ?.replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: bunnyHost || "**.b-cdn.net",
      },
    ],
  },
};

export default nextConfig;
