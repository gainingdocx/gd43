import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lint remains a required standalone quality check (`npm run check`), but it
  // should not repeat during every Next/OpenNext production bundle.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self' https://*.paddle.com",
        "script-src 'self' 'unsafe-inline' https://cdn.paddle.com https://*.paddle.com https://www.googletagmanager.com https://us.i.posthog.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.paddle.com https://www.google-analytics.com https://*.google-analytics.com https://us.i.posthog.com https://*.sentry.io",
        "frame-src https://*.paddle.com",
        "worker-src 'self' blob:",
        "upgrade-insecure-requests",
      ].join("; ") },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
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
