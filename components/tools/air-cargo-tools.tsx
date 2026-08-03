"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileCheck2, Plane, ShieldAlert, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeAwbNumber, validateAwbNumber } from "@/lib/validators/air-waybill";

const field = "min-h-12 w-full rounded-lg border bg-background px-3 py-2";

function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AirWaybillNumberCheck() {
  const [text, setText] = useState("");
  const numbers = [...new Set(text.split(/[\s,;]+/).map(normalizeAwbNumber).filter(Boolean))].slice(0, 100);
  const results = numbers.map((number) => ({ number, validation: validateAwbNumber("awb_number", number) }));
  const valid = results.filter((item) => item.validation.status === "pass").length;
  const download = () => downloadText(
    "air-waybill-number-check.csv",
    ["Entered,Airline prefix,Serial,Printed digit,Status,Expected,Message", ...results.map(({ number, validation }) => [
      number, number.slice(0, 3), number.slice(3, 10), number.slice(10), validation.status,
      validation.expected ?? "", validation.message,
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))].join("\n"),
    "text/csv",
  );

  return <>
    <label className="text-sm font-medium">Master Air Waybill numbers (one per line or separated by spaces; up to 100)
      <textarea className={`${field} mt-2 min-h-32 font-mono`} placeholder="123-12345675" value={text} onChange={(event) => setText(event.target.value)} />
    </label>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Use this for airline-issued MAWB numbers. HAWB references can use a forwarder&apos;s own format and are not rejected for lacking an airline check digit.</p>
    {results.length > 0 && <>
      <p className="mt-4 text-sm font-bold text-primary">{valid} valid · {results.length - valid} need review</p>
      <ul className="mt-3 max-h-96 divide-y overflow-auto rounded-xl border bg-background">
        {results.map(({ number, validation }) => <li key={number} className="flex gap-3 p-3">
          {validation.status === "pass" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />}
          <div className="min-w-0"><strong className="font-mono">{number || "Empty"}</strong><p className="mt-1 text-sm text-muted-foreground">{validation.message}</p>{validation.expected && validation.status !== "pass" && <p className="mt-1 text-sm">Expected final digit: <strong>{validation.expected}</strong></p>}</div>
        </li>)}
      </ul>
      <Button className="mt-3" variant="outline" onClick={download}><Download aria-hidden /> Export CSV</Button>
    </>}
  </>;
}

type Role = "exporter" | "forwarder";
type Cargo = "general" | "consolidation" | "dangerous" | "perishable";
type ChecklistItem = { name: string; why: string; level: "core" | "conditional" };

const BASE: ChecklistItem[] = [
  { name: "Commercial invoice", why: "Commercial value, parties, origin and commodity evidence", level: "core" },
  { name: "Packing list", why: "Physical pieces, dimensions, net/gross weight and packing evidence", level: "core" },
  { name: "Shipper's Letter of Instruction", why: "The exporter's route, party and handling instructions", level: "core" },
  { name: "Air Waybill", why: "The air carriage record used for route, weight and charge checks", level: "core" },
  { name: "Certificate of origin / licences", why: "Add when required by the commodity, destination, buyer or customs procedure", level: "conditional" },
  { name: "Cargo Security Declaration", why: "Add when required by the applicable security chain and lane", level: "conditional" },
];

export function AirCargoDocumentChecklist() {
  const [role, setRole] = useState<Role>("exporter");
  const [cargo, setCargo] = useState<Cargo>("general");
  const items = useMemo(() => {
    const next = [...BASE];
    if (role === "forwarder" || cargo === "consolidation") next.push(
      { name: "Master Air Waybill and all House Air Waybills", why: "Required to reconcile parent references, route and consolidation totals", level: "core" },
      { name: "Air cargo manifest", why: "Waybill list, flight, pieces and weight evidence for the consolidation", level: "core" },
    );
    if (cargo === "dangerous") next.push(
      { name: "Shipper's Declaration for Dangerous Goods", why: "UN, proper shipping name, class, packing and aircraft-limitation evidence", level: "core" },
      { name: "Safety Data Sheet and approvals", why: "Supporting evidence when applicable; confirm current carrier and regulatory requirements", level: "conditional" },
    );
    if (cargo === "perishable") next.push(
      { name: "Temperature and handling instructions", why: "Required operational range, packaging and monitoring instructions", level: "core" },
      { name: "Health, phytosanitary or product certificate", why: "Add only when required by commodity and destination", level: "conditional" },
    );
    return next;
  }, [role, cargo]);
  const workflow = cargo === "dangerous" ? "dangerous_goods_document_check" : cargo === "consolidation" ? "air_consolidation_check" : "air_export_readiness";

  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">I am preparing paperwork as
        <select className={`${field} mt-2`} value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="exporter">Exporter / shipper</option>
          <option value="forwarder">Freight forwarder</option>
        </select>
      </label>
      <label className="text-sm font-medium">Cargo scenario
        <select className={`${field} mt-2`} value={cargo} onChange={(event) => setCargo(event.target.value as Cargo)}>
          <option value="general">General cargo</option>
          <option value="consolidation">Consolidation (MAWB + HAWBs)</option>
          <option value="dangerous">Dangerous goods</option>
          <option value="perishable">Perishable / temperature-sensitive</option>
        </select>
      </label>
    </div>
    <div className="mt-5 overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-3 bg-primary px-4 py-3 text-white"><Plane className="size-5" aria-hidden /><div><p className="font-bold">Your air paperwork pack</p><p className="text-xs text-white/70">Core documents first; confirm conditional requirements for the lane and cargo.</p></div></div>
      <ul className="divide-y bg-background">{items.map((item) => <li key={item.name} className="flex gap-3 p-4"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-primary">{item.name}</p><span className={item.level === "core" ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black uppercase text-success" : "rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#765600]"}>{item.level}</span></div><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.why}</p></div></li>)}</ul>
    </div>
    <div className="mt-5 flex gap-3 rounded-2xl bg-warning/10 p-4 text-sm leading-6"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden /><p>Requirements vary by origin, destination, commodity, airline and customer. This checklist organizes the file; it does not replace current customs, security, dangerous-goods or carrier instructions.</p></div>
    <div className="mt-5 flex flex-wrap gap-3"><Button render={<Link href={`/app/scan?type=batch&workflow=${workflow}`} />} className="bg-signal text-white hover:bg-signal/90">Start this document workflow</Button><Button render={<Link href="/app/email-in" />} variant="outline">Use email-in instead</Button></div>
  </>;
}
