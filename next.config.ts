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
//
// Guarded to dev because next.config is evaluated on every invocation, so an
// unguarded call also opened a remote binding proxy during production builds —
// where it is not used and where a failure to start it ("write EOF",
// "the service was stopped") aborts the whole build. The production bundle gets
// its bindings from the OpenNext pipeline, not from here.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
