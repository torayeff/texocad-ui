import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
