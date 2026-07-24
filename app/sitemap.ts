import type { MetadataRoute } from "next";
import { GUIDES } from "@/content/guides";
import { FEATURES } from "@/content/features";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { SITE_URL } from "@/lib/seo/jsonld";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastSignificantUpdate = new Date("2026-07-22T00:00:00.000Z");
  const fixed = ["", "/about", "/pricing", "/contact", "/privacy", "/terms", "/features", "/templates", "/tools", "/guides"];
  const paths = [
    ...fixed,
    ...FEATURES.map((feature) => `/features/${feature.slug}`),
    ...PARSER_PAGES.map((p) => `/${p.slug}`),
    ...TEMPLATES.map((t) => `/templates/${t.slug}`),
    ...TOOLS.map((t) => `/tools/${t.slug}`),
    ...GUIDES.map((g) => `/guides/${g.slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: lastSignificantUpdate }));
}
