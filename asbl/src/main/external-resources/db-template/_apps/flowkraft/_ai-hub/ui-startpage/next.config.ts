import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ["react-markdown"],
};

export default nextConfig;
