import type { MetadataRoute } from "next";
import { GUIDES } from "@/content/guides";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { SITE_URL } from "@/lib/seo/jsonld";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = ["", "/pricing", "/contact", "/privacy", "/terms", "/templates", "/tools", "/guides"];
  const paths = [
    ...fixed,
    ...PARSER_PAGES.map((p) => `/${p.slug}`),
    ...TEMPLATES.map((t) => `/templates/${t.slug}`),
    ...TOOLS.map((t) => `/tools/${t.slug}`),
    ...GUIDES.map((g) => `/guides/${g.slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: path.startsWith("/guides/") ? "monthly" : "weekly", priority: path === "" ? 1 : path.split("/").length === 2 ? 0.8 : 0.7 }));
}
