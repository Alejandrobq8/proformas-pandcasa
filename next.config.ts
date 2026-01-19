import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/proformas/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
