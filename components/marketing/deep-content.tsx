import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CircleCheck, Info, ListChecks } from "lucide-react";

import type { CalloutTone, DeepContent, DeepSection, DeepTable, RelatedLink } from "@/content/deep/types";
import { cn } from "@/lib/utils";

/**
 * Renders the long-form body shared by tool, template, parser and feature
 * pages. Headings are emitted as a strict h2 → h3 ladder underneath the page
 * H1 so the outline stays machine-readable, and every section gets a stable
 * `#slug` anchor that the table of contents and external deep links can target.
 */

export function sectionAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const CALLOUT_STYLES: Record<CalloutTone, { wrap: string; icon: typeof Info }> = {
  info: { wrap: "border-primary/20 bg-secondary text-secondary-foreground", icon: Info },
  warn: { wrap: "border-warning/35 bg-warning/10 text-foreground", icon: AlertTriangle },
  check: { wrap: "border-success/30 bg-success/10 text-foreground", icon: CircleCheck },
};

function Callout({ title, body, tone = "info" }: { title: string; body: string; tone?: CalloutTone }) {
  const style = CALLOUT_STYLES[tone];
  const Icon = style.icon;
  return (
    <div className={cn("mt-6 flex gap-3 rounded-2xl border p-5", style.wrap)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1.5 text-sm leading-7">{body}</p>
      </div>
    </div>
  );
}

export function DataTable({ table }: { table: DeepTable }) {
  return (
    <figure className="mt-6">
      {table.caption && (
        <figcaption className="mb-2 text-sm font-semibold text-primary">{table.caption}</figcaption>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead className="bg-secondary">
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-bold text-primary">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.join("|")} className="border-t border-border align-top">
                {row.map((cell, index) => (
                  <td key={index} className={cn("px-4 py-3 leading-6", index === 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <p className="mt-2 text-xs leading-6 text-muted-foreground">{table.note}</p>}
    </figure>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3 rounded-2xl bg-secondary p-5 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-7">
          <CircleCheck className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Numbered({ items }: { items: string[] }) {
  return (
    <ol className="mt-5 space-y-4">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 leading-7 text-muted-foreground">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Section({ section }: { section: DeepSection }) {
  return (
    <section id={sectionAnchor(section.heading)} className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold tracking-tight text-brand-deep sm:text-3xl">{section.heading}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="mt-4 text-base leading-8 text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {section.bullets && <Bullets items={section.bullets} />}
      {section.numbered && <Numbered items={section.numbered} />}
      {section.table && <DataTable table={section.table} />}
      {section.subsections?.map((sub) => (
        <div key={sub.heading} id={sectionAnchor(sub.heading)} className="mt-8 scroll-mt-24">
          <h3 className="text-lg font-extrabold text-primary sm:text-xl">{sub.heading}</h3>
          {sub.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="mt-3 leading-8 text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {sub.bullets && <Bullets items={sub.bullets} />}
        </div>
      ))}
      {section.callout && <Callout {...section.callout} />}
    </section>
  );
}

export function QuickAnswerCard({ content }: { content: DeepContent }) {
  const { quickAnswer } = content;
  return (
    <div className="rounded-3xl border border-amber/45 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal">Short answer</p>
        {content.updated && (
          <time dateTime={content.updated} className="text-xs font-medium text-muted-foreground">
            Updated {new Date(`${content.updated}T00:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </time>
        )}
      </div>
      <h2 className="mt-2 text-2xl font-extrabold text-brand-deep">{quickAnswer.heading}</h2>
      <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground">{quickAnswer.body}</p>
      {quickAnswer.bullets && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {quickAnswer.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 rounded-xl bg-background p-3 text-sm leading-6 font-medium">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TableOfContents({ content, faqHeading = "Frequently asked questions" }: { content: DeepContent; faqHeading?: string }) {
  return (
    <nav aria-label="On this page" className="rounded-2xl border border-border bg-white p-5">
      <p className="flex items-center gap-2 font-bold text-primary">
        <ListChecks className="size-4" aria-hidden />
        On this page
      </p>
      <ol className="mt-4 space-y-2 text-sm leading-5 text-muted-foreground">
        {content.sections.map((section) => (
          <li key={section.heading}>
            <a className="hover:text-primary hover:underline" href={`#${sectionAnchor(section.heading)}`}>
              {section.heading}
            </a>
          </li>
        ))}
        <li>
          <a className="hover:text-primary hover:underline" href="#faq">
            {faqHeading}
          </a>
        </li>
      </ol>
    </nav>
  );
}

export function FaqList({
  faqs,
  heading = "Frequently asked questions",
  intro,
}: {
  faqs: { q: string; a: string }[];
  heading?: string;
  intro?: string;
}) {
  return (
    <section id="faq" className="scroll-mt-24">
      <h2 className="text-3xl font-extrabold text-brand-deep">{heading}</h2>
      {intro && <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{intro}</p>}
      <div className="mt-7 divide-y divide-border border-y border-border">
        {faqs.map((faq) => (
          <details key={faq.q} className="group py-5">
            <summary className="cursor-pointer list-none">
              <h3 className="inline font-bold text-primary group-open:text-brand-deep">{faq.q}</h3>
            </summary>
            <p className="mt-3 leading-8 text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function RelatedLinks({
  links,
  heading = "Related tools, templates and guides",
  intro,
}: {
  links: RelatedLink[];
  heading?: string;
  intro?: string;
}) {
  if (!links.length) return null;
  return (
    <section className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold text-brand-deep">{heading}</h2>
      {intro && <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{intro}</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <span className="flex items-start justify-between gap-3 font-bold text-primary">
                {link.label}
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
              </span>
              <span className="mt-2 text-sm leading-6 text-muted-foreground">{link.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The full editorial body: sticky table of contents beside the section stack,
 * followed by FAQs and the internal-link cluster.
 */
export function DeepContentBody({
  content,
  faqHeading = "Frequently asked questions",
  faqIntro,
  relatedHeading,
  relatedIntro,
  children,
}: {
  content: DeepContent;
  faqHeading?: string;
  faqIntro?: string;
  relatedHeading?: string;
  relatedIntro?: string;
  /** Optional block rendered between the sections and the FAQ list. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <TableOfContents content={content} faqHeading={faqHeading} />
      </aside>
      <div className="min-w-0 space-y-12">
        {content.sections.map((section) => (
          <Section key={section.heading} section={section} />
        ))}
        {children}
        <FaqList faqs={content.faqs} heading={faqHeading} intro={faqIntro} />
        <RelatedLinks links={content.related} heading={relatedHeading} intro={relatedIntro} />
      </div>
    </div>
  );
}
