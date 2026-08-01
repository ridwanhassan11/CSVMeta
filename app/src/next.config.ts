import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        "csvmeta-drab.vercel.app",
      ],
    },
  },
};

export default nextConfig;