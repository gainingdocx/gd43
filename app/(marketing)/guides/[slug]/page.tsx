import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, ChevronRight, ExternalLink } from "lucide-react";

import { GUIDES } from "@/content/guides";
import { articleLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;
export function generateStaticParams() { return GUIDES.map((guide) => ({ slug: guide.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES.find((item) => item.slug === slug);
  if (!guide) return {};
  return {
    title: { absolute: `${guide.seoTitle ?? guide.title} | GainingDocx` },
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `/guides/${slug}`,
      modifiedTime: guide.updated,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((item) => item.slug === slug);
  if (!guide) notFound();
  const structuredData = [
    breadcrumbLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title, path: `/guides/${slug}` }]),
    articleLd({ headline: guide.title, description: guide.description, path: `/guides/${slug}`, datePublished: guide.updated ?? "2026-07-20", dateModified: guide.updated }),
    ...(guide.faqs ? [faqLd(guide.faqs)] : []),
  ];

  return <>
    <JsonLd data={structuredData} />
    <article>
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden />
            <Link href="/guides">Guides</Link><ChevronRight className="size-3" aria-hidden />
            <span className="line-clamp-1">{guide.title}</span>
          </nav>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">{guide.readMinutes} minute practical guide</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">{guide.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{guide.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>Reviewed by GainingDocx</span>
            {guide.updated && <time dateTime={guide.updated}>Updated {new Date(`${guide.updated}T00:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time>}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-white p-5">
            <p className="font-bold text-primary">On this page</p>
            <ol className="mt-4 space-y-2 text-sm leading-5 text-muted-foreground">
              {guide.sections.map((section, index) => <li key={section.heading}><a className="hover:text-primary" href={`#section-${index + 1}`}>{section.heading}</a></li>)}
              {guide.faqs && <li><a className="hover:text-primary" href="#frequently-asked-questions">Frequently asked questions</a></li>}
            </ol>
          </div>
        </aside>

        <div className="min-w-0">
          {guide.tool && <section className="mb-10 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Free practical tool</p>
            <h2 className="mt-2 text-2xl font-extrabold">{guide.tool.title}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">{guide.tool.description}</p>
            <Link href={guide.tool.href} data-analytics-feature={`Guide to tool: ${guide.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-signal px-5 font-bold text-white hover:bg-[var(--signal)]">{guide.tool.label}<ArrowRight className="size-4" aria-hidden /></Link>
          </section>}

          <div className="space-y-12">
            {guide.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading} className="scroll-mt-24">
              <h2 className="text-2xl font-extrabold tracking-tight text-brand-deep sm:text-3xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 40)} className="mt-4 text-base leading-8 text-muted-foreground">{paragraph}</p>)}
              {section.bullets && <ul className="mt-5 space-y-3 rounded-2xl bg-secondary p-5 text-muted-foreground">
                {section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 leading-7"><BookOpenCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden /><span>{bullet}</span></li>)}
              </ul>}
            </section>)}
          </div>

          {guide.tool && <section className="mt-12 rounded-3xl border border-primary/15 bg-secondary p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-brand-deep">Put the guide into practice</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{guide.tool.description}</p>
            <Link href={guide.tool.href} data-analytics-feature={`Guide CTA to tool: ${guide.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-white">{guide.tool.label}<ArrowRight className="size-4" aria-hidden /></Link>
          </section>}

          {guide.faqs && <section id="frequently-asked-questions" className="mt-14 scroll-mt-24">
            <h2 className="text-3xl font-extrabold text-brand-deep">Frequently asked questions</h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {guide.faqs.map((faq) => <details key={faq.q} className="py-5"><summary className="cursor-pointer font-bold text-primary">{faq.q}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.a}</p></details>)}
            </div>
          </section>}

          {guide.sources && <section className="mt-14 border-t pt-8">
            <h2 className="text-xl font-extrabold text-brand-deep">Research sources and further reading</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Operational terms vary by carrier, contract and jurisdiction. These sources informed the guide; verify the current governing document for a live shipment.</p>
            <ul className="mt-5 space-y-4">
              {guide.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">{source.name}<ExternalLink className="size-3.5" aria-hidden /></a><p className="mt-1 text-sm leading-6 text-muted-foreground">{source.note}</p></li>)}
            </ul>
          </section>}
        </div>
      </div>
    </article>
  </>;
}
