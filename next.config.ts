import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    qualities: [75, 85, 90],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [375, 640, 750, 828, 1080],
    imageSizes: [16, 32, 64, 96, 128],
    remotePatterns: [],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
