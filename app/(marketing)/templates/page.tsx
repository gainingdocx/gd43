import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { TEMPLATES } from "@/content/templates";
import { breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Free Shipping Document Templates | Word, Excel & PDF",
  description: "Fill online or download 11 editable shipping document templates for invoices, packing lists, shipping instructions and transport-data worksheets.",
  alternates: { canonical: "/templates" },
};

const GROUPS = [
  { name: "Plan, quote & clear", description: "Establish the commercial and customs facts first.", slugs: ["pro-forma-invoice-template", "commercial-invoice-template", "certificate-of-origin-template"] },
  { name: "Pack & instruct", description: "Choose the packing depth that matches the shipment, then instruct the carrier.", slugs: ["simple-packing-list-template", "packing-list-template", "container-packing-list-template", "shipping-instructions-template"] },
  { name: "Transport & release", description: "Prepare transport evidence and destination release checks.", slugs: ["bill-of-lading-template", "air-waybill-template", "arrival-notice-template", "delivery-order-template"] },
];

export default function TemplatesHub() {
  return <>
    <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }])} />
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-signal">11 working templates · no login</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-primary">Free Shipping Document Templates</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground">Fill shipping forms online or download editable Word, Excel and PDF templates for commercial invoices, packing lists, shipping instructions and transport-data worksheets.</p>
      <div className="mt-10 space-y-12">
        {GROUPS.map((group) => <section key={group.name}>
          <h2 className="text-2xl font-bold text-primary">{group.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {group.slugs.map((slug) => TEMPLATES.find((item) => item.slug === slug)).filter((item) => item !== undefined).map((template) =>
              <Link key={template.slug} href={`/templates/${template.slug}`} className="group flex min-h-64 flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-lg">
                <FileSpreadsheet className="size-8 text-signal" aria-hidden />
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
