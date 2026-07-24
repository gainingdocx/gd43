import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calculator, FileSpreadsheet, FileStack, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

export const metadata: Metadata = {
  title: { default: "Account", template: "%s · GainingDocx" },
  robots: { index: false, follow: false },
};

/** Highlighter emphasis for the phrase a shipper actually scans for. */
function Mark({ children }: { children: ReactNode }) {
  return <mark className="rounded-[0.3rem] bg-[#f4c400] px-1.5 py-[0.1rem] font-bold text-[#01267c]">{children}</mark>;
}

const USPS: { icon: typeof ScanLine; body: ReactNode }[] = [
  {
    icon: ScanLine,
    body: (
      <>
        Every field pulled from <Mark>Bills of Lading</Mark>, <Mark>Invoices</Mark> &amp; <Mark>Packing Lists</Mark> — no templates to train
      </>
    ),
  },
  {
    icon: ShieldCheck,
    body: (
      <>
        <Mark>Auto-validated</Mark> container numbers, UN/LOCODE ports, weights and <Mark>dangerous goods</Mark>
      </>
    ),
  },
  {
    icon: FileStack,
    body: (
      <>
        <Mark>Three-way matching</Mark> across invoice, packing list and B/L — discrepancies surface before they cost you
      </>
    ),
  },
  {
    icon: FileSpreadsheet,
    body: (
      <>
        One click to <Mark>Excel</Mark>, <Mark>CSV</Mark>, <Mark>PDF</Mark> — or a <Mark>revocable share link</Mark> for your customer
      </>
    ),
  },
  {
    icon: Sparkles,
    body: (
      <>
        <Mark>Generate</Mark> a Commercial Invoice or Packing List straight from a document you already have
      </>
    ),
  },
];

const TEMPLATES = ["Bill of Lading", "Commercial Invoice", "Packing List", "Air Waybill", "Certificate of Origin", "Shipping Instructions"];
const TOOLS = ["CBM Calculator", "Container Load", "Chargeable Weight", "Demurrage & Detention", "HS Code Finder", "Container Number Check"];

function ChipRow({ items, href, moreLabel }: { items: string[]; href: string; moreLabel: string }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
          {item}
        </span>
      ))}
      <Link
        href={href}
        className="rounded-full border border-[#f4c400]/40 bg-[#f4c400]/10 px-2.5 py-1 text-[11px] font-bold text-[#f4c400] transition hover:bg-[#f4c400]/20"
      >
        {moreLabel}
      </Link>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,rgba(1,59,179,0.16),transparent_34rem),linear-gradient(145deg,#f8fbff,#fff_52%,#fff9ec)]">
      <div className="mx-auto grid min-h-screen max-w-[86rem] lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden bg-primary px-10 py-8 text-white lg:flex lg:flex-col xl:px-14">
          {/* Depth behind the brand wall without shipping an image. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(244,196,0,0.22),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[radial-gradient(circle,rgba(212,5,5,0.18),transparent_70%)]"
          />

          <Link href="/" className="relative w-fit rounded-xl bg-white/10 px-3 py-2 transition hover:bg-white/15" aria-label="GainingDocx home">
            <BrandWordmark compact inverse />
          </Link>

          <div className="relative my-auto max-w-xl py-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              <Sparkles className="size-3.5" aria-hidden /> Shipping paperwork, under control
            </p>

            {/* Deliberately not an <h1>: this panel is shared chrome, and each
                auth page owns the real heading beside it. */}
            <p className="mt-5 text-[2.15rem] font-black leading-[1.1] tracking-[-0.04em] xl:text-[2.5rem]">
              One login. Your complete <span className="text-[#f4c400]">shipping document</span> system.
            </p>

            <ul className="mt-6 space-y-3">
              {USPS.map(({ icon: UspIcon, body }, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]">
                    <UspIcon className="size-[1.05rem] text-primary" aria-hidden />
                  </span>
                  <span className="pt-1 text-[0.92rem] leading-[1.6rem] text-white">{body}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-3.5 rounded-2xl border border-white/25 bg-white/[0.10] p-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
                  <FileSpreadsheet className="size-3.5 text-[#f4c400]" aria-hidden /> 11 free templates
                </p>
                <ChipRow items={TEMPLATES} href="/templates" moreLabel="+5 more" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
                  <Calculator className="size-3.5 text-[#f4c400]" aria-hidden /> 9 free calculators
                </p>
                <ChipRow items={TOOLS} href="/tools" moreLabel="+3 more" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <Link href="/" className="mb-7 flex w-fit lg:hidden" aria-label="GainingDocx home">
            <BrandWordmark />
          </Link>

          {/* Sits clear of the card rather than overlapping it: the card's
              backdrop-blur makes overlap paint order unreliable. */}
          <span aria-hidden className="relative mb-3 hidden size-24 shrink-0 items-center justify-center lg:flex">
            {/* Halo sits behind the disc and swells at half speed; the disc
                itself breathes. Both stop for prefers-reduced-motion. */}
            <span className="absolute size-24 animate-[mark-glow_4.8s_ease-in-out_infinite] rounded-full bg-[#f4c400]/30 blur-2xl motion-reduce:hidden" />
            <span className="relative flex size-20 animate-[mark-pulse_2.4s_ease-in-out_infinite] items-center justify-center rounded-full border-2 border-[#f4c400]/70 bg-white shadow-[0_18px_45px_rgba(1,59,179,0.18)] motion-reduce:animate-none">
              <Image src="/logo.png" alt="" width={60} height={60} unoptimized className="size-[3.6rem] rounded-full" />
            </span>
          </span>

          <div className="w-full max-w-xl">{children}</div>

          <p className="mt-7 text-center text-xs text-muted-foreground lg:hidden">
            Parse, validate and generate shipping documents · 11 free templates · 9 free calculators
          </p>
        </section>
      </div>
    </main>
  );
}
