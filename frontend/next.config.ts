import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "scholar-flow-uploads.s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
