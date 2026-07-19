import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/app",
    },
    sitemap: "https://gainingdocx.com/sitemap.xml",
    host: "https://gainingdocx.com",
  };
}
