import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/numcalc',
  assetPrefix: '/numcalc/',
  trailingSlash: true,
};

export default nextConfig;
