// Structured-data helpers (BUILD_SPEC §M8): FAQPage, HowTo, BreadcrumbList,
// Article. One <JsonLd> component renders any of them.

export const SITE_URL = "https://gainingdocx.com";

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "GainingDocx",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "AI extraction and deterministic validation for shipping documents.",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "GainingDocx",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function serviceLd(name: string, description: string, path: string) {
  return { "@context": "https://schema.org", "@type": "Service", name, description, url: `${SITE_URL}${path}`, provider: { "@id": `${SITE_URL}/#organization` } };
}

export function webApplicationLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}

export function templateLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name,
    description,
    url: `${SITE_URL}${path}`,
    isAccessibleForFree: true,
    encodingFormat: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function aboutPageLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About GainingDocx",
    url: `${SITE_URL}/about`,
    description: "How GainingDocx makes shipping paperwork easier with AI extraction, deterministic validation, free tools and editable templates.",
    mainEntity: { "@id": `${SITE_URL}/#organization` },
  };
}

export function collectionPageLd(name: string, path: string, items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "CollectionPage", name, url: `${SITE_URL}${path}`, hasPart: items.map((item) => ({ "@type": "WebPage", name: item.name, url: `${SITE_URL}${item.path}` })) };
}

export interface Faq {
  q: string;
  a: string;
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function howToLd(name: string, steps: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function articleLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    publisher: {
      "@type": "Organization",
      name: "GainingDocx",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
