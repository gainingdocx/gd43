import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // backdrop-seal.png is a non-content decorative layer; keep it out of
      // crawls and image indexing entirely.
      disallow: ["/api/", "/auth/", "/backdrop-seal.png"],
    },
    sitemap: "https://gainingdocx.com/sitemap.xml",
    host: "https://gainingdocx.com",
  };
}
