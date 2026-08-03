import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { TEMPLATES } from "@/content/templates";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Free Shipping Document Templates | Word, Excel & PDF",
  description: "Fill online or download 11 editable shipping document templates for invoices, packing lists, shipping instructions and transport-data worksheets.",
  alternates: { canonical: "/templates" },
};

const GROUPS = [
  { mode: "air" as const, name: "Air freight templates", description: "Prepare air routing, chargeable-weight and handling data for an airline or forwarder.", slugs: ["air-waybill-template"] },
  { mode: "ocean" as const, name: "Ocean freight templates", description: "Prepare container, carrier-instruction, B/L, arrival and release paperwork.", slugs: ["bill-of-lading-template", "shipping-instructions-template", "container-packing-list-template", "arrival-notice-template", "delivery-order-template"] },
  { mode: "multimodal" as const, name: "Shared trade templates", description: "Commercial, origin and packing documents used with either freight mode.", slugs: ["pro-forma-invoice-template", "commercial-invoice-template", "certificate-of-origin-template", "simple-packing-list-template", "packing-list-template"] },
];

export default function TemplatesHub() {
  return <>
    <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }])} />
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-signal">11 working templates · no login</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-primary">Free Shipping Document Templates</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground">Choose Air, Ocean or Shared before opening a form. This keeps transport-specific worksheets separate from commercial and packing documents used across modes.</p>
      <div className="mt-10 space-y-12">
        {GROUPS.map((group) => <section key={group.name}>
          <div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={group.mode} className="h-7 rounded-full px-3 text-[10px]" /><h2 className="text-2xl font-bold text-primary">{group.name}</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {group.slugs.map((slug) => TEMPLATES.find((item) => item.slug === slug)).filter((item) => item !== undefined).map((template) =>
              <Link key={template.slug} href={`/templates/${template.slug}`} className="group flex min-h-64 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-lg">
                <div className="flex items-start justify-between gap-3"><FileSpreadsheet className="size-8 text-signal" aria-hidden /><span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{group.mode === "multimodal" ? "Shared form" : `${group.mode} form`}</span></div>
                <h3 className="mt-4 text-xl font-bold">{template.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{template.description}</p>
                <div className="mt-4 flex gap-2 text-[11px] font-bold text-muted-foreground"><span className="rounded-full bg-secondary px-2 py-1">PDF</span><span className="rounded-full bg-secondary px-2 py-1">Excel</span><span className="rounded-full bg-secondary px-2 py-1">Word</span></div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">Use template <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
              </Link>)}
          </div>
        </section>)}
      </div>
    </section>
  </>;
}
