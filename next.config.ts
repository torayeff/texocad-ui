import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LANGGRAPH_API_URL_V2:
      process.env["NEXT_PUBLIC_LANGGRAPH_API_URL-V2"]
      ?? process.env.NEXT_PUBLIC_LANGGRAPH_API_URL_V2,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
