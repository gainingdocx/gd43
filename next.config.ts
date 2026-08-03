import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Lint remains a required standalone quality check (`npm run check`), but it
  // should not repeat during every Next/OpenNext production bundle.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

// Makes Cloudflare bindings (env, ctx) available during `next dev`.
initOpenNextCloudflareForDev();
