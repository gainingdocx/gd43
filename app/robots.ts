import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // backdrop-seal.png is a non-content decorative layer; keep it out of
      // crawls and image indexing entirely. /app and /share are authenticated
      // or token-scoped and have nothing to index — crawling them only burns
      // budget that should go to the marketing surface.
      disallow: ["/api/", "/auth/", "/app/", "/share/", "/suhasgovind/", "/backdrop-seal.png"],
    },
    sitemap: "https://gainingdocx.com/sitemap.xml",
    host: "https://gainingdocx.com",
  };
}
