import createMDX from "@next/mdx"
import { withContentlayer } from "next-contentlayer2"

import "./env.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {},
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client"],
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
}

const withMDX = createMDX({})

export default withContentlayer(withMDX(nextConfig))
