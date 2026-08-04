import type { MetadataRoute } from "next";
import { FEATURE_DEEP } from "@/content/deep/features";
import { PARSER_DEEP } from "@/content/deep/parsers";
import { TEMPLATE_DEEP } from "@/content/deep/templates";
import { TOOL_DEEP } from "@/content/deep/tools";
import { GUIDES } from "@/content/guides";
import { FEATURES } from "@/content/features";
import { PARSER_PAGES } from "@/content/parsers";
import { TEMPLATES } from "@/content/templates";
import { TOOLS } from "@/content/tools";
import { SITE_URL } from "@/lib/seo/jsonld";

type Entry = MetadataRoute.Sitemap[number];

const FALLBACK_UPDATED = "2026-08-04";

function date(value: string | undefined): Date {
  return new Date(`${value ?? FALLBACK_UPDATED}T00:00:00.000Z`);
}

function entry(path: string, priority: number, changeFrequency: Entry["changeFrequency"], lastModified?: string): Entry {
  return { url: `${SITE_URL}${path}`, lastModified: date(lastModified), changeFrequency, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Primary entry points.
    entry("", 1.0, "weekly"),
    entry("/air-freight", 0.9, "monthly"),
    entry("/ocean-freight", 0.9, "monthly"),
    entry("/pricing", 0.8, "monthly"),

    // Hubs. These carry ItemList structured data and are the parents of the
    // detail pages below, so they rank above individual entries.
    entry("/document-parsers", 0.9, "weekly"),
    entry("/features", 0.8, "monthly"),
    entry("/tools", 0.8, "weekly"),
    entry("/templates", 0.8, "weekly"),
    entry("/guides", 0.8, "weekly"),

    // Detail pages, ordered by the search intent they serve. Tools and
    // templates attract the highest non-brand volume, so they lead.
    ...TOOLS.map((tool) => entry(`/tools/${tool.slug}`, 0.8, "monthly", TOOL_DEEP[tool.slug]?.updated)),
    ...TEMPLATES.map((template) => entry(`/templates/${template.slug}`, 0.8, "monthly", TEMPLATE_DEEP[template.slug]?.updated)),
    ...GUIDES.map((guide) => entry(`/guides/${guide.slug}`, 0.7, "monthly", guide.updated)),
    ...PARSER_PAGES.map((parser) => entry(`/${parser.slug}`, 0.7, "monthly", PARSER_DEEP[parser.slug]?.updated)),
    ...FEATURES.map((feature) => entry(`/features/${feature.slug}`, 0.7, "monthly", FEATURE_DEEP[feature.slug]?.updated)),

    // Supporting and trust pages.
    entry("/about", 0.5, "yearly"),
    entry("/contact", 0.5, "yearly"),
    entry("/sample-discrepancy-report", 0.5, "yearly"),
    entry("/trust", 0.4, "yearly"),
    entry("/security", 0.4, "yearly"),
    entry("/accuracy-and-limitations", 0.4, "yearly"),
    entry("/standards", 0.4, "yearly"),
    entry("/privacy", 0.3, "yearly"),
    entry("/terms", 0.3, "yearly"),
  ];
}
