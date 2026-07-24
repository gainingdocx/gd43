import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

const FEATURES = [
  { icon: FileCheck2, text: "Cross-document checks for references, weights and dangerous goods" },
  { icon: ShieldCheck, text: "Private storage, owner-scoped access and complete audit history" },
  { icon: CheckCircle2, text: "20 documents each month on the free plan — no card required" },
];

export const metadata: Metadata = {
  title: { default: "Account", template: "%s · GainingDocx" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_5%,rgba(1,59,179,0.16),transparent_34rem),linear-gradient(145deg,#f8fbff,#fff_52%,#fff9ec)]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.92fr_1.08fr]">
        <section className="hidden border-r border-white/60 bg-primary px-10 py-12 text-white lg:flex lg:flex-col">
          <Link href="/" className="w-fit rounded-xl bg-white/10 px-3 py-2" aria-label="GainingDocx home">
            <BrandWordmark compact inverse />
          </Link>
          <div className="my-auto max-w-lg">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100">
              <Sparkles className="size-3.5" aria-hidden /> Shipping paperwork, under control
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] xl:text-5xl">
              From inbox chaos to shipment-ready records.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
              Parse, validate, compare, review and export logistics documents with one secure workspace for your team.
            </p>
            <ul className="mt-9 space-y-4 text-sm">
              {FEATURES.map(({ icon: FeatureIcon, text }) => {
                return (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <FeatureIcon className="size-4 text-yellow-300" aria-hidden />
                    </span>
                    <span className="pt-1 leading-6 text-blue-50">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-xs text-blue-200">Secure authentication powered by Supabase · Passwords are never visible to GainingDocx.</p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-lg">
            <Link href="/" className="mb-8 flex w-fit lg:hidden" aria-label="GainingDocx home">
              <BrandWordmark />
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
