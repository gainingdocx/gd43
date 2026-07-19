import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { TEMPLATES } from "@/content/templates";
import { breadcrumbLd, faqLd, howToLd, JsonLd } from "@/lib/seo/jsonld";

export const dynamicParams=true;
export function generateStaticParams(){return TEMPLATES.map((t)=>({slug:t.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const t=TEMPLATES.find((x)=>x.slug===slug);return t?{title:`Free ${t.name} — PDF, XLSX & DOCX`,description:t.description,alternates:{canonical:`/templates/${slug}`}}:{};}
export default async function TemplatePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const t=TEMPLATES.find((x)=>x.slug===slug);if(!t)notFound();return <><JsonLd data={[breadcrumbLd([{name:"Home",path:"/"},{name:"Templates",path:"/templates"},{name:t.name,path:`/templates/${slug}`}]),howToLd(`How to use the ${t.name}`,["Fill the shipment and party details.","Add cargo lines; totals and CBM update automatically.","Review and download PDF, XLSX or DOCX."]),faqLd(t.faqs)]}/><section className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><nav className="text-xs text-muted-foreground"><Link href="/templates">Templates</Link> / {t.name}</nav><h1 className="mt-3 text-4xl font-bold tracking-tight">Free {t.name}</h1><p className="mt-3 max-w-3xl text-lg text-muted-foreground">{t.description} Your entries stay in this browser and are not uploaded.</p><div className="mt-8"><TemplateBuilder template={t}/></div><section className="mt-14 max-w-3xl"><h2 className="text-2xl font-bold">Frequently asked questions</h2>{t.faqs.map((f)=><details key={f.q} className="border-b py-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</section></section></>;}
