import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a standalone server bundle for container deployments (Coolify).
  output: "standalone",
};

export default nextConfig;
