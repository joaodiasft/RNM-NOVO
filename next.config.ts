import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Em dev (Node local) o cliente wasm do Prisma não carrega;
      // usa o cliente padrão. Em produção (Cloudflare Workers) fica o wasm.
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client/wasm": require.resolve("@prisma/client"),
      };
    }
    return config;
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
