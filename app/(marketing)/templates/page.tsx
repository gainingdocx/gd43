import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileSpreadsheet } from "lucide-react";

import { FaqList } from "@/components/marketing/deep-content";
import { TEMPLATES } from "@/content/templates";
import { FreightModeTag } from "@/components/ui/freight-mode-tag";
import { breadcrumbLd, collectionPageLd, faqLd, itemListLd, JsonLd } from "@/lib/seo/jsonld";

const TITLE = "Free Shipping Document Templates | Word, Excel & PDF";
const DESCRIPTION =
  "Fill online or download editable shipping document templates: commercial invoices, packing lists, shipping instructions, B/L and air waybill worksheets, certificates of origin and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "shipping document templates",
    "commercial invoice template",
    "packing list template",
    "bill of lading template",
    "shipping instructions format",
    "export document templates",
    "free shipping forms",
  ],
  alternates: { canonical: "/templates" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/templates", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const GROUPS = [
  { mode: "air" as const, name: "Air freight templates", description: "Prepare air routing, chargeable-weight and handling data for an airline or forwarder.", slugs: ["air-waybill-template"] },
  { mode: "ocean" as const, name: "Ocean freight templates", description: "Prepare container, carrier-instruction, B/L, arrival and release paperwork.", slugs: ["bill-of-lading-template", "shipping-instructions-template", "container-packing-list-template", "arrival-notice-template", "delivery-order-template"] },
  { mode: "multimodal" as const, name: "Shared trade templates", description: "Commercial, origin and packing documents used with either freight mode.", slugs: ["pro-forma-invoice-template", "commercial-invoice-template", "certificate-of-origin-template", "simple-packing-list-template", "packing-list-template"] },
];

const FAQS = [
  {
    q: "Are these templates free to use?",
    a: "Yes. Every template can be completed in the browser and downloaded without an account. Editable Excel and Word starter files are available alongside the generated PDF for teams that maintain documents offline.",
  },
  {
    q: "Which of these documents can I actually issue myself?",
    a: "Commercial invoices, pro forma invoices and packing lists are yours to issue and sign. Bills of lading, air waybills, certificates of origin and delivery orders require a specific issuing authority — a carrier, an airline or cargo agent, a chamber of commerce or the party controlling the cargo. For those, the template is a data worksheet for preparation and for checking the issued document.",
  },
  {
    q: "Why is a Bill of Lading template a worksheet rather than a form?",
    a: "Because a Bill of Lading evidences the carrier's receipt of goods and its contract of carriage, and where negotiable it is a document of title. Only the carrier, NVOCC or an authorised agent can make those statements. The worksheet assembles complete particulars for submission as shipping instructions and lets you check the carrier's draft field by field.",
  },
  {
    q: "Are my entries uploaded when I fill in a template?",
    a: "The template forms are designed to keep entries in the browser while you prepare the document. Review any finished file before sharing it with a carrier, customer, broker or authority — the responsibility for what a document states remains with whoever issues it.",
  },
  {
    q: "Can I download in Word or Excel rather than PDF?",
    a: "Yes. Complete the browser form and download a generated PDF, or take an editable XLSX or DOCX starter file for offline work — which is what most carriers and customers expect when they ask for a document 'in Word format'.",
  },
  {
    q: "Do the templates calculate totals?",
    a: "Where totals exist, yes. Line amounts, package counts, net and gross weights and CBM are calculated from the rows rather than typed, which removes the most common defect in real shipping documents: a printed total that does not equal the sum of its lines.",
  },
  {
    q: "Will these templates be accepted by customs?",
    a: "A commercial invoice or packing list you complete and sign is your document and is used exactly as any other would be. Requirements do vary by destination, so confirm anything jurisdiction-specific with your broker. Worksheets for documents you cannot issue are for preparation, not for submission as the document itself.",
  },
  {
    q: "Can I generate a template from documents I already have?",
    a: "Yes, in the workspace. Where a related document has been extracted and reviewed — an invoice, a booking confirmation, a packing list — its data can populate a counterpart draft, so parties, references, cargo lines and weights carry across rather than being retyped. That is also what keeps the two documents consistent.",
  },
  {
    q: "What if a letter of credit specifies a document format?",
    a: "The credit's requirements govern, and they are frequently stricter than customs. Read the credit before preparing anything: it may prescribe the goods description word for word, the number of originals, who must sign, and what a packing list must show. A document that satisfies customs perfectly can still be a discrepancy under a credit.",
  },
  {
    q: "Do I need a different packing list for multiple containers?",
    a: "Yes — use the container packing list, which allocates every package to a specific container and seal number with subtotals per unit. Once cargo spans more than one container, shipment totals alone cannot support a customs examination, a shortage claim or a VGM reconciliation.",
  },
];

export default function TemplatesHub() {
  const items = TEMPLATES.map((template) => ({ name: template.name, path: `/templates/${template.slug}`, description: template.description }));

  return <>
    <JsonLd data={[
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }]),
      collectionPageLd("Shipping document templates", "/templates", items),
      itemListLd("Shipping document templates", "/templates", items),
      faqLd(FAQS),
    ]} />
    <section className="section-edge bg-[radial-gradient(circle_at_82%_8%,rgba(1,59,179,0.12),transparent_28rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Link href="/">Home</Link><ChevronRight className="size-3" aria-hidden /><span>Templates</span>
        </nav>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-signal">{TEMPLATES.length} working templates · no login</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-deep sm:text-5xl">Free shipping document templates</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Fillable templates for the documents an exporter issues itself, and structured data worksheets for the
          documents only a carrier, airline or competent authority can issue. Each one is laid out with the fields
          customs, carriers and banks actually look for, and totals are calculated from the lines rather than typed.
        </p>
        <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">
          Choose Air, Ocean or Shared before opening a form. This keeps transport-specific worksheets separate from the
          commercial and packing documents used across both modes.
        </p>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-12">
        {GROUPS.map((group) => <section key={group.name}>
          <div className="flex flex-wrap items-center gap-3"><FreightModeTag mode={group.mode} className="h-7 rounded-full px-3 text-[10px]" /><h2 className="text-2xl font-extrabold text-brand-deep sm:text-3xl">{group.name}</h2></div>
          <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{group.description}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
      <FaqList faqs={FAQS} heading="About the templates" />
    </section>
  </>;
}
