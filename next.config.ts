import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "51.79.50.210","dztesters.online","www.dztesters.online",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
    ];
  },
  // output: "standalone", // Enable this for production VPS deployment
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default withNextIntl(nextConfig);
