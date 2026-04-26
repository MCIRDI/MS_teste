import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Temporarily disabled for development
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
