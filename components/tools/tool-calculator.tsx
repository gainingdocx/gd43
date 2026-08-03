"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy, Download, Plus, Printer, Search, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemurrageAuditCalculator } from "@/components/tools/demurrage-audit-calculator";
import { AirCargoDocumentChecklist, AirWaybillNumberCheck } from "@/components/tools/air-cargo-tools";
import { trackFeatureUse } from "@/lib/analytics/client";
import {
  calculateContainerFit,
  calculateFreeTimeCharge,
  calculateLclWm,
  chargeableWeight,
  CONTAINER_SPECS,
  volumeM3,
  volumetricWeight,
  type DimensionUnit,
  type RotationRule,
  type WeightUnit,
} from "@/lib/tools/calculations";
import { computeCheckDigit, normalizeContainerNo, validateContainerNo } from "@/lib/validators/container";

const field = "min-h-12 w-full rounded-lg border bg-background px-3 py-2";
function num(v: string) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; }
function fmt(v: number, digits = 3) { return v.toLocaleString(undefined, { maximumFractionDigits: digits }); }

type CargoRow = { l: string; w: string; h: string; qty: string; weight: string; description: string };
const cargoRow = (): CargoRow => ({ l: "", w: "", h: "", qty: "1", weight: "", description: "" });

export function ToolCalculator({ slug }: { slug: string }) {
  const started = useRef(false);
  let body: React.ReactNode;
  if (slug === "cbm-calculator") body = <CbmCalculator />;
  else if (slug === "container-load-calculator") body = <ContainerLoadCalculator />;
  else if (slug === "container-number-check") body = <ContainerNumberCheck />;
  else if (slug === "chargeable-weight-calculator") body = <ChargeableWeightCalculator />;
  else if (slug === "air-waybill-number-check") body = <AirWaybillNumberCheck />;
  else if (slug === "air-cargo-document-checklist") body = <AirCargoDocumentChecklist />;
  else if (slug === "lcl-freight-calculator") body = <LclFreightCalculator />;
  else if (slug === "demurrage-detention-calculator") body = <DemurrageAuditCalculator />;
  else if (slug === "hs-code-finder") body = <HsCodeFinder />;
  else if (slug === "shipping-mark-generator") body = <ShippingMarkGenerator />;
  else body = <PortLookup />;
  const next = TOOL_NEXT_STEPS[slug] ?? { label: "Parse the supporting document", href: "/app/scan" };
  function recordStart() {
    if (started.current) return;
    started.current = true;
    trackFeatureUse(`Tool started: ${slug}`);
  }
  return <div><div onInputCapture={recordStart} onChangeCapture={recordStart} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">{body}</div><div className="mt-6 rounded-xl border bg-secondary p-4"><p className="text-xs font-bold uppercase tracking-wider text-signal">Recommended next step</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium">{next.label}</p><div className="flex flex-wrap gap-2"><Button render={<Link href={next.href} data-analytics-feature={`Tool next step: ${slug}`} />} className="bg-signal text-signal-foreground hover:bg-signal/90">Continue workflow <ArrowRight aria-hidden/></Button><Button render={<Link href="/app/scan" data-analytics-feature={`Tool to document scan: ${slug}`} />} variant="outline">Use document data</Button></div></div></div></div>;
}

const TOOL_NEXT_STEPS: Record<string, { label: string; href: string }> = {
  "cbm-calculator": { label: "Put verified dimensions and CBM into a detailed packing list.", href: "/templates/packing-list-template" },
  "container-load-calculator": { label: "Carry the selected equipment and loading assumptions into shipping instructions.", href: "/templates/shipping-instructions-template" },
  "container-number-check": { label: "Parse the B/L and compare its container and seal evidence.", href: "/bill-of-lading-parser" },
  "port-code-lookup": { label: "Use the verified UN/LOCODE in carrier shipping instructions.", href: "/templates/shipping-instructions-template" },
  "chargeable-weight-calculator": { label: "Audit the calculated weight against the freight invoice.", href: "/freight-invoice-parser" },
  "air-waybill-number-check": { label: "Parse the complete AWB and review its route, weights and cargo lines.", href: "/air-waybill-parser" },
  "air-cargo-document-checklist": { label: "Start the guided air-freight paperwork workspace.", href: "/app/air-freight" },
  "lcl-freight-calculator": { label: "Parse the freight invoice and match quoted versus billed charges.", href: "/freight-invoice-parser" },
  "demurrage-detention-calculator": { label: "Check dates and free time against the arrival notice before disputing charges.", href: "/arrival-notice-parser" },
  "hs-code-finder": { label: "Parse the commercial invoice and review codes beside each cargo line.", href: "/commercial-invoice-parser" },
  "shipping-mark-generator": { label: "Add the same marks and case references to an export packing list.", href: "/templates/packing-list-template" },
};

function CbmCalculator() {
  const [rows, setRows] = useState<CargoRow[]>([cargoRow()]);
  const [unit, setUnit] = useState("cm");
  const calculated = rows.map((row) => ({ ...row, cbm: volumeM3(num(row.l), num(row.w), num(row.h), num(row.qty), unit as DimensionUnit), totalKg: num(row.weight) * num(row.qty) }));
  const cbm = calculated.reduce((sum, row) => sum + row.cbm, 0);
  const kg = calculated.reduce((sum, row) => sum + row.totalKg, 0);
  const set = (i: number, key: keyof CargoRow, value: string) => setRows((old) => old.map((row, index) => index === i ? { ...row, [key]: value } : row));
  function downloadCsv() {
    const csv = ["Description,Length,Width,Height,Unit,Quantity,Weight per piece kg,Total CBM,Total kg", ...calculated.map((r) => [r.description, r.l, r.w, r.h, unit, r.qty, r.weight, r.cbm, r.totalKg].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")), `TOTAL,,,,,,,${cbm},${kg}`].join("\n");
    downloadText("cbm-calculation.csv", csv, "text/csv");
  }
  return <>
    <div className="flex flex-wrap items-end justify-between gap-3"><label className="text-sm">Dimension unit<select className={`${field} mt-1`} value={unit} onChange={(e) => setUnit(e.target.value)}><option value="mm">Millimetres</option><option value="cm">Centimetres</option><option value="m">Metres</option><option value="in">Inches</option></select></label><Button variant="outline" onClick={() => setRows([...rows, cargoRow()])}><Plus /> Add cargo group</Button></div>
    <div className="mt-4 space-y-3">{calculated.map((row, i) => <div key={i} className="rounded-xl border p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7"><Input label="Description" type="text" value={row.description} set={(x)=>set(i,"description",x)} /><Input label={`Length (${unit})`} value={row.l} set={(x)=>set(i,"l",x)} /><Input label={`Width (${unit})`} value={row.w} set={(x)=>set(i,"w",x)} /><Input label={`Height (${unit})`} value={row.h} set={(x)=>set(i,"h",x)} /><Input label="Quantity" value={row.qty} set={(x)=>set(i,"qty",x)} /><Input label="Weight / piece kg" value={row.weight} set={(x)=>set(i,"weight",x)} /><div className="flex items-end justify-between gap-2 rounded-lg bg-accent p-2 text-sm"><span><span className="block text-xs text-muted-foreground">Row volume</span><strong>{fmt(row.cbm)} CBM</strong></span>{rows.length > 1 && <Button size="icon" variant="ghost" aria-label={`Remove cargo group ${i + 1}`} onClick={() => setRows(rows.filter((_, index) => index !== i))}><Trash2 /></Button>}</div></div></div>)}</div>
    <Result label="Total shipment volume" value={`${fmt(cbm)} CBM`} note={`Total gross weight from entered piece weights: ${fmt(kg, 1)} kg. Each row converts ${unit} dimensions to cubic metres before summing.`}/>
    <Button className="mt-3" variant="outline" onClick={downloadCsv}><Download /> Export calculation CSV</Button>
  </>;
}

function ContainerLoadCalculator() {
  const [v, setV] = useState<Record<string, string>>({ container: "40hc", unit: "cm", qty: "1", rotate: "all" });
  const spec = CONTAINER_SPECS[v.container] ?? CONTAINER_SPECS["40hc"];
  const requested = num(v.qty);
  const fit = calculateContainerFit({
    spec,
    cartonDimensions: [num(v.l), num(v.w), num(v.h)],
    unit: v.unit as DimensionUnit,
    quantity: requested,
    pieceKg: num(v.weight),
    rotation: v.rotate as RotationRule,
  });
  const best = fit.best;
  const update = (key:string,value:string) => setV((old)=>({...old,[key]:value}));
  const viable = fit.fitsOne;
  return <>
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm sm:col-span-2">Container<select className={`${field} mt-1`} value={v.container} onChange={(e)=>update("container",e.target.value)}>{Object.entries(CONTAINER_SPECS).map(([key,c])=><option key={key} value={key}>{c.name}</option>)}</select></label><label className="text-sm">Dimension unit<select className={`${field} mt-1`} value={v.unit} onChange={(e)=>update("unit",e.target.value)}><option value="cm">Centimetres</option><option value="m">Metres</option><option value="in">Inches</option></select></label></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Carton length" value={v.l} set={(x)=>update("l",x)} /><Input label="Carton width" value={v.w} set={(x)=>update("w",x)} /><Input label="Carton height" value={v.h} set={(x)=>update("h",x)} /><Input label="Carton quantity" value={v.qty} set={(x)=>update("qty",x)} /><Input label="Gross kg per carton" value={v.weight} set={(x)=>update("weight",x)} /><label className="text-sm">Rotation rule<select className={`${field} mt-1`} value={v.rotate} onChange={(e)=>update("rotate",e.target.value)}><option value="all">All 90° rotations</option><option value="upright">Keep upright; rotate on floor</option><option value="fixed">Fixed orientation</option></select></label></div>
    <Result label={viable ? "Fits by simple orthogonal stowage" : "Estimated containers required"} value={viable ? `Yes — ${requested} of ${fit.maxUnits} units` : fit.containersNeeded ? `${fit.containersNeeded} × ${spec.name}` : best.doorFits ? "Enter carton dimensions" : "Does not pass the container door"} note={`Best grid orientation: ${fmt(best.length,2)} × ${fmt(best.width,2)} × ${fmt(best.height,2)} m. Door ${spec.door[0]} × ${spec.door[1]} m: ${best.doorFits ? "passes" : "blocked"}. Spatial maximum ${best.count}; weight maximum ${Number.isFinite(fit.maxByWeight)?fit.maxByWeight:"not calculated"}. Cargo ${fmt(fit.cargoCbm)} CBM / ${fmt(fit.cargoKg,1)} kg versus nominal ${spec.nominalCbm} CBM / ${spec.payloadKg.toLocaleString()} kg payload.`}/>
    <p className="mt-3 text-xs text-muted-foreground">This is a deterministic identical-carton grid feasibility check. It accounts for internal dimensions, door aperture, permitted rotations and payload, but not pallets, mixed-SKU optimization, bracing, axle distribution or dangerous-goods segregation. Confirm the carrier’s equipment sheet and loading plan.</p>
  </>;
}

function ContainerNumberCheck() {
  const [text, setText] = useState("");
  const numbers = [...new Set(text.split(/[\s,;]+/).map(normalizeContainerNo).filter(Boolean))].slice(0, 100);
  const results = numbers.map((number) => ({ number, result: validateContainerNo("container_no", number), expected: number.length >= 10 ? `${number.slice(0,10)}${computeCheckDigit(number) ?? ""}` : "" }));
  const valid = results.filter((r)=>r.result.status === "pass").length;
  const download = () => downloadText("container-number-check.csv", ["Entered,Status,Expected,Message", ...results.map((r)=>[r.number,r.result.status,r.expected,r.result.message].map((x)=>`"${String(x).replace(/"/g,'""')}"`).join(","))].join("\n"), "text/csv");
  return <><label className="text-sm">Container numbers (one per line or separated by spaces; up to 100)<textarea className={`${field} mt-1 min-h-32 font-mono uppercase`} placeholder="MSCU6639870\nCSQU3054383" value={text} onChange={(e)=>setText(e.target.value)} /></label>{results.length>0 && <><p className="mt-3 text-sm font-medium">{valid} valid · {results.length-valid} need review</p><ul className="mt-3 max-h-96 divide-y overflow-auto rounded-xl border">{results.map(({number,result,expected})=><li key={number} className="flex gap-3 p-3">{result.status==='pass'?<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success"/>:<XCircle className="mt-0.5 size-5 shrink-0 text-destructive"/>}<div><strong className="font-mono">{number}</strong><p className="text-sm text-muted-foreground">{result.message}</p>{result.status!=="pass"&&expected&&<p className="text-sm">Expected full number: <strong className="font-mono">{expected}</strong></p>}</div></li>)}</ul><Button className="mt-3" variant="outline" onClick={download}><Download/> Export CSV</Button></>}</>;
}

function ChargeableWeightCalculator() {
  const [rows, setRows] = useState<CargoRow[]>([cargoRow()]);
  const [mode, setMode] = useState("express5000");
  const [unit, setUnit] = useState("cmkg");
  const [custom, setCustom] = useState("5000");
  const [rounding, setRounding] = useState("none");
  const [rate, setRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const dimensionUnit: DimensionUnit = unit === "inlb" ? "in" : "cm";
  const weightUnit: WeightUnit = unit === "inlb" ? "lb" : "kg";
  const divisorBasis = unit === "inlb" ? "in3_per_lb" as const : "cm3_per_kg" as const;
  const divisor = mode === "air6000" ? (unit === "inlb" ? 166 : 6000) : mode === "custom" ? Math.max(1,num(custom)) : unit === "inlb" ? 139 : 5000;
  const set = (i:number,key:keyof CargoRow,value:string)=>setRows((old)=>old.map((r,x)=>x===i?{...r,[key]:value}:r));
  const round = (value:number) => rounding === "1" ? Math.ceil(value) : rounding === "0.5" ? Math.ceil(value * 2) / 2 : value;
  const detail = rows.map((r)=>{
    const actual = num(r.weight) * num(r.qty);
    const volumetric = volumetricWeight(num(r.l), num(r.w), num(r.h), num(r.qty), dimensionUnit, divisor, weightUnit, divisorBasis);
    return { ...r, actual, volumetric, chargeable: round(chargeableWeight(actual, volumetric)) };
  });
  const actual = detail.reduce((s,r)=>s+r.actual,0);
  const volumetric = detail.reduce((s,r)=>s+r.volumetric,0);
  const chargeable = detail.reduce((s,r)=>s+r.chargeable,0);
  const estimatedCost = chargeable * num(rate);
  function downloadCsv() {
    const csv = ["Description,Length,Width,Height,Pieces,Actual per piece,Actual total,Volumetric,Chargeable,Unit,Divisor", ...detail.map((r)=>[r.description,r.l,r.w,r.h,r.qty,r.weight,r.actual,r.volumetric,r.chargeable,weightUnit,divisor].map((x)=>`"${String(x).replace(/"/g,'""')}"`).join(",")), `TOTAL,,,,,,${actual},${volumetric},${chargeable},${weightUnit},${divisor}`].join("\n");
    downloadText("chargeable-weight-calculation.csv",csv,"text/csv");
  }
  return <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">Tariff basis<select className={`${field} mt-1`} value={mode} onChange={(e)=>setMode(e.target.value)}><option value="express5000">Express courier — 5,000 cm³/kg or 139 in³/lb</option><option value="air6000">General air cargo — 6,000 cm³/kg or 166 in³/lb</option><option value="custom">Custom carrier divisor</option></select></label><label className="text-sm">Units<select className={`${field} mt-1`} value={unit} onChange={(e)=>{const next=e.target.value;setUnit(next);if(mode==="custom")setCustom(next==="inlb"?"139":"5000");}}><option value="cmkg">cm / kg</option><option value="inlb">in / lb</option></select></label><label className="text-sm">Round each cargo line<select className={`${field} mt-1`} value={rounding} onChange={(e)=>setRounding(e.target.value)}><option value="none">No rounding</option><option value="0.5">Up to next 0.5 {weightUnit}</option><option value="1">Up to next whole {weightUnit}</option></select></label>{mode==="custom"?<Input label={`Custom divisor (${unit === "inlb" ? "in³/lb" : "cm³/kg"})`} value={custom} set={setCustom}/>:<div className="rounded-xl bg-accent p-3 text-sm"><span className="block text-xs text-muted-foreground">Applied divisor</span><strong>{divisor.toLocaleString()} {unit === "inlb" ? "in³/lb" : "cm³/kg"}</strong></div>}</div>
    <div className="mt-4 space-y-3">{detail.map((r,i)=><div key={i} className="rounded-xl border p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7"><Input label="Description" type="text" value={r.description} set={(x)=>set(i,"description",x)}/><Input label={`Length (${dimensionUnit})`} value={r.l} set={(x)=>set(i,"l",x)}/><Input label={`Width (${dimensionUnit})`} value={r.w} set={(x)=>set(i,"w",x)}/><Input label={`Height (${dimensionUnit})`} value={r.h} set={(x)=>set(i,"h",x)}/><Input label="Pieces" value={r.qty} set={(x)=>set(i,"qty",x)}/><Input label={`Actual / piece (${weightUnit})`} value={r.weight} set={(x)=>set(i,"weight",x)}/><div className="flex items-end justify-between gap-2 rounded-lg bg-accent p-2 text-sm"><span><span className="block text-xs text-muted-foreground">Line chargeable</span><strong>{fmt(r.chargeable,1)} {weightUnit}</strong><span className="block text-xs text-muted-foreground">{fmt(r.actual,1)} actual / {fmt(r.volumetric,1)} volume</span></span>{rows.length>1&&<Button size="icon" variant="ghost" aria-label={`Remove package group ${i+1}`} onClick={()=>setRows(rows.filter((_,x)=>x!==i))}><Trash2/></Button>}</div></div></div>)}</div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setRows([...rows,cargoRow()])}><Plus/> Add package group</Button><Button data-analytics-feature="Chargeable weight CSV exported" variant="outline" onClick={downloadCsv}><Download/> Export CSV audit</Button></div>
    <Result label="Total chargeable weight" value={`${fmt(chargeable,1)} ${weightUnit}`} note={`Line-by-line total: actual ${fmt(actual,1)} ${weightUnit}; volumetric ${fmt(volumetric,1)} ${weightUnit}; divisor ${divisor}. Each line uses the higher actual or volumetric result before the selected rounding.`}/>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><Input label={`Freight rate per ${weightUnit} (optional)`} value={rate} set={setRate}/><Input label="Currency" type="text" value={currency} set={(value)=>setCurrency(value.toUpperCase().slice(0,3))}/><div className="rounded-xl bg-secondary p-3"><span className="text-xs text-muted-foreground">Estimated freight</span><strong className="block text-lg">{currency || "USD"} {fmt(estimatedCost,2)}</strong></div></div><p className="mt-3 text-xs text-muted-foreground">Carrier rules, minimums, per-piece rating and rounding differ. Select the contracted tariff basis; do not use the express divisor for general air cargo or vice versa.</p></>;
}

function LclFreightCalculator() {
  const [v, setV] = useState<Record<string, string>>({ currency: "USD", minimum: "1" });
  const update = (key: string, value: string) => setV((old) => ({ ...old, [key]: value }));
  const result = calculateLclWm({
    cbm: num(v.cbm), grossKg: num(v.grossKg), ratePerRevenueTon: num(v.rate),
    minimumRevenueTons: num(v.minimum), originCharges: num(v.origin),
    destinationCharges: num(v.destination), otherCharges: num(v.other),
  });
  const currency = (v.currency || "USD").toUpperCase().slice(0, 3);
  return <>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Shipment CBM" value={v.cbm} set={(x)=>update("cbm",x)}/><Input label="Gross weight (kg)" value={v.grossKg} set={(x)=>update("grossKg",x)}/><Input label={`Ocean rate (${currency} / W/M)`} value={v.rate} set={(x)=>update("rate",x)}/><Input label="Minimum W/M" value={v.minimum} set={(x)=>update("minimum",x)}/></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Origin charges" value={v.origin} set={(x)=>update("origin",x)}/><Input label="Destination charges" value={v.destination} set={(x)=>update("destination",x)}/><Input label="Other charges" value={v.other} set={(x)=>update("other",x)}/><Input label="Currency" type="text" value={v.currency} set={(x)=>update("currency",x)}/></div>
    <Result label="Estimated LCL freight total" value={`${currency} ${fmt(result.total,2)}`} note={`Chargeable ${fmt(result.chargeableRevenueTons,3)} revenue tons by ${result.basis}. Measurement ${fmt(result.volumeRevenueTons,3)} CBM versus weight ${fmt(result.weightRevenueTons,3)} metric tons. Base freight ${currency} ${fmt(result.baseFreight,2)} plus ${currency} ${fmt(result.accessorials,2)} entered charges.`}/>
    <p className="mt-3 text-xs text-muted-foreground">Uses the common ocean LCL W/M rule: one revenue ton is the greater of 1 CBM or 1,000 kg, subject to the entered minimum. Quotes may use trade-lane-specific minimums, rounding, density rules, currencies and surcharges; enter every quoted charge before comparing against a freight invoice.</p>
  </>;
}

/** @deprecated Kept only for backwards-compatible embedding; the public tool uses the multi-container audit above. */
export function LegacyDemurrageDetentionCalculator() {
  const [v, setV] = useState<Record<string, string>>({ currency: "USD", freeDays: "5", tierDays: "5", chargeType: "demurrage", dayBasis: "calendar", convention: "exclusive" });
  const update = (key: string, value: string) => setV((old) => ({ ...old, [key]: value }));
  const result = calculateFreeTimeCharge({
    startDate: v.startDate ?? "", endDate: v.endDate ?? "", freeDays: num(v.freeDays),
    firstTierDays: num(v.tierDays), firstTierDailyRate: num(v.firstRate),
    secondTierDailyRate: num(v.secondRate), fixedCharges: num(v.fixed),
    dayBasis: v.dayBasis === "weekdays" ? "weekdays" : "calendar",
    includeStartDate: v.convention === "inclusive",
  });
  const currency = (v.currency || "USD").toUpperCase().slice(0, 3);
  const typeLabel = v.chargeType === "detention" ? "Detention" : v.chargeType === "combined" ? "Combined demurrage and detention" : "Demurrage";
  const startLabel = v.chargeType === "detention" ? "Full-container gate-out date" : v.chargeType === "combined" ? "Combined free-time start date" : "Discharge / availability date";
  const endLabel = v.chargeType === "detention" ? "Empty-return gate-in date" : v.chargeType === "combined" ? "Empty-return / final event date" : "Full-container gate-out date";
  function downloadCsv() {
    const csv = ["Charge type,Start date,End date,Day basis,Start convention,Elapsed days,Free days,Chargeable days,Tier 1 days,Tier 1 charge,Later days,Later charge,Fixed charges,Currency,Total", [typeLabel,v.startDate,v.endDate,v.dayBasis,v.convention,result.elapsedDays,result.freeDays,result.chargeableDays,result.firstTierDays,result.firstTierCharge,result.secondTierDays,result.secondTierCharge,result.fixedCharges,currency,result.total].map((x)=>`"${String(x??"").replace(/"/g,'""')}"`).join(",")].join("\n");
    downloadText("demurrage-detention-audit.csv",csv,"text/csv");
  }
  return <>
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Charge type<select className={`${field} mt-1`} value={v.chargeType} onChange={(e)=>update("chargeType",e.target.value)}><option value="demurrage">Demurrage — inside terminal</option><option value="detention">Detention — outside terminal</option><option value="combined">Combined D&amp;D</option></select></label><label className="text-sm">Tariff day basis<select className={`${field} mt-1`} value={v.dayBasis} onChange={(e)=>update("dayBasis",e.target.value)}><option value="calendar">Calendar days</option><option value="weekdays">Monday–Friday only</option></select></label><label className="text-sm">Start-date convention<select className={`${field} mt-1`} value={v.convention} onChange={(e)=>update("convention",e.target.value)}><option value="exclusive">Exclude start date</option><option value="inclusive">Include start date</option></select></label></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label={startLabel} type="date" value={v.startDate} set={(x)=>update("startDate",x)}/><Input label={endLabel} type="date" value={v.endDate} set={(x)=>update("endDate",x)}/><Input label="Contractual free days" value={v.freeDays} set={(x)=>update("freeDays",x)}/><Input label="First-tier days" value={v.tierDays} set={(x)=>update("tierDays",x)}/></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label={`First-tier daily rate (${currency})`} value={v.firstRate} set={(x)=>update("firstRate",x)}/><Input label={`Later daily rate (${currency})`} value={v.secondRate} set={(x)=>update("secondRate",x)}/><Input label="Fixed / administrative charges" value={v.fixed} set={(x)=>update("fixed",x)}/><Input label="Currency" type="text" value={v.currency} set={(x)=>update("currency",x)}/></div>
    <Result label={`Estimated ${typeLabel.toLowerCase()} charges`} value={`${currency} ${fmt(result.total,2)}`} note={`${result.elapsedDays} ${v.dayBasis === "weekdays" ? "Monday–Friday" : "calendar"} days less ${result.freeDays} free days = ${result.chargeableDays} chargeable days. Tier 1: ${result.firstTierDays} days / ${currency} ${fmt(result.firstTierCharge,2)}; later tier: ${result.secondTierDays} days / ${currency} ${fmt(result.secondTierCharge,2)}; fixed charges ${currency} ${fmt(result.fixedCharges,2)}.`}/>
    <Button data-analytics-feature="Demurrage calculation CSV exported" className="mt-3" variant="outline" onClick={downloadCsv}><Download/> Export calculation audit</Button>
    <p className="mt-3 text-xs text-muted-foreground">Date-counting conventions differ by carrier, terminal, equipment event and jurisdiction. “Monday–Friday” does not remove local public holidays. Confirm the governing tariff, holiday calendar, event timestamps, combined-free-time terms and whether storage is billed separately before relying on this audit.</p>
  </>;
}

function PortLookup() {
  const [q,setQ]=useState(""); const [ports,setPorts]=useState<{code:string;name:string}[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [searched,setSearched]=useState(false);
  async function search(){setLoading(true);setSearched(false);setError("");try{const response=await fetch(`/api/tools/port-lookup?q=${encodeURIComponent(q)}`);if(!response.ok)throw new Error();const data=await response.json() as {results?:{code:string;name:string}[]};setPorts(data.results??[]);setSearched(true);}catch{setPorts([]);setError("Port lookup is temporarily unavailable. Please try again.");}finally{setLoading(false);}}
  return <><div className="flex gap-2"><input aria-label="Port name or UN/LOCODE" className={field} placeholder="Port name or code, e.g. SGSIN" value={q} onChange={(e)=>{setQ(e.target.value);setSearched(false);}} onKeyDown={(e)=>{if(e.key==='Enter'&&q.trim().length>=2)void search()}}/><Button onClick={()=>void search()} disabled={loading||q.trim().length<2}><Search/>{loading?'Searching':'Search'}</Button></div>{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<ul className="mt-4 divide-y rounded-xl border bg-background">{ports.map((p)=><li key={p.code} className="flex items-center justify-between gap-4 p-3"><span>{p.name}</span><span className="flex items-center gap-2"><strong className="font-mono">{p.code}</strong><Button size="icon" variant="ghost" aria-label={`Copy ${p.code}`} onClick={()=>void navigator.clipboard.writeText(p.code)}><Copy className="size-4"/></Button></span></li>)}</ul>{searched&&!loading&&!error&&ports.length===0&&<p className="mt-4 text-sm text-muted-foreground">No maritime location matched. Try the city name without “Port of”, or the five-character code.</p>}</>;
}

type HsResult = { hts: string; hs6: string; description: string; generalRate: string | null; specialRate: string | null; otherRate: string | null; units: string[] };
function HsCodeFinder() {
  const [q,setQ]=useState(""); const [results,setResults]=useState<HsResult[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [searched,setSearched]=useState(false);
  async function search(){setLoading(true);setError("");setSearched(false);try{const response=await fetch(`/api/tools/hs-search?q=${encodeURIComponent(q)}`);const data=await response.json() as {results?:HsResult[];error?:string};if(!response.ok)throw new Error(data.error||"Lookup failed");setResults(data.results??[]);setSearched(true);}catch(cause){setResults([]);setError(cause instanceof Error?cause.message:"Tariff lookup is temporarily unavailable.");}finally{setLoading(false);}}
  return <><div className="flex gap-2"><input aria-label="Commodity description" className={field} placeholder="e.g. frozen squid, cotton shirts, ceramic mugs" value={q} onChange={(e)=>{setQ(e.target.value);setSearched(false);}} onKeyDown={(e)=>{if(e.key==='Enter'&&q.trim().length>=2)void search();}}/><Button onClick={()=>void search()} disabled={loading||q.trim().length<2}><Search/>{loading?"Searching":"Search official HTS"}</Button></div>{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}{results.length>0&&<div className="mt-4 overflow-x-auto rounded-xl border bg-background"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-accent text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3">HS 6-digit</th><th className="p-3">U.S. HTS</th><th className="p-3">Description</th><th className="p-3">General rate</th></tr></thead><tbody className="divide-y">{results.map((r,i)=><tr key={`${r.hts}-${i}`}><td className="p-3 font-mono font-bold text-primary">{r.hs6||"—"}</td><td className="p-3 font-mono">{r.hts}</td><td className="p-3">{r.description}</td><td className="p-3">{r.generalRate||"See schedule"}</td></tr>)}</tbody></table></div>}{searched&&!loading&&!error&&results.length===0&&<p className="mt-4 text-sm text-muted-foreground">No close description matched. Try the material and product type without brand names.</p>}<p className="mt-4 text-xs leading-5 text-muted-foreground">Official U.S. HTS reference, not a binding classification. The first six digits are the internationally harmonized portion; longer digits and duty treatment are country-specific. Rates can also depend on origin, trade programs, quotas and additional duties. Confirm with the importing customs authority or a licensed broker.</p></>;
}

function ShippingMarkGenerator() {
  const [v,setV]=useState<Record<string,string>>({packageRange:"1 OF 1",handling:"KEEP DRY"}); const update=(key:string,value:string)=>setV((old)=>({...old,[key]:value}));
  const rows=[v.consignee,v.destination&&`DESTINATION: ${v.destination}`,v.po&&`PO: ${v.po}`,v.packageRange&&`CASE: ${v.packageRange}`,v.weight&&`GROSS / NET: ${v.weight}`,v.dimensions&&`DIMENSIONS: ${v.dimensions}`,v.handling].filter(Boolean) as string[]; const mark=rows.join("\n");
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Shipping Mark</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;display:grid;place-items:center;min-height:90vh}.mark{width:150mm;min-height:150mm;border:4px solid #111;padding:14mm;box-sizing:border-box;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:8mm;font-size:18pt;font-weight:700;text-transform:uppercase}.brand{font-size:9pt;font-weight:400;color:#555;text-transform:none;margin-top:8mm}</style></head><body><div class="mark">${rows.map((row)=>`<div>${escapeHtml(row)}</div>`).join("")}<div class="brand">Created with GainingDocx · Export Smarter</div></div></body></html>`;
  function printMark(){const win=window.open("","_blank","noopener,noreferrer");if(!win)return;win.document.write(html);win.document.close();win.addEventListener("load",()=>win.print());}
  return <><div className="grid gap-3 sm:grid-cols-2"><Input label="Consignee / main mark" type="text" value={v.consignee} set={(x)=>update("consignee",x)}/><Input label="Destination" type="text" value={v.destination} set={(x)=>update("destination",x)}/><Input label="PO / reference" type="text" value={v.po} set={(x)=>update("po",x)}/><Input label="Case range" type="text" value={v.packageRange} set={(x)=>update("packageRange",x)}/><Input label="Gross / net weight" type="text" value={v.weight} set={(x)=>update("weight",x)}/><Input label="Dimensions" type="text" value={v.dimensions} set={(x)=>update("dimensions",x)}/><div className="sm:col-span-2"><Input label="Handling instruction" type="text" value={v.handling} set={(x)=>update("handling",x)}/></div></div><div className="mx-auto mt-6 flex min-h-80 max-w-xl flex-col items-center justify-center gap-4 border-4 border-primary bg-white p-8 text-center text-xl font-black uppercase text-primary">{rows.length?rows.map((row,i)=><div key={i}>{row}</div>):<span className="text-muted-foreground">Enter mark details</span>}<span className="text-xs font-medium normal-case text-muted-foreground">GainingDocx · Export Smarter</span></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={printMark} disabled={!mark}><Printer/> Print / save PDF</Button><Button variant="outline" onClick={()=>downloadText("shipping-mark.html",html,"text/html")} disabled={!mark}><Download/> Download editable HTML</Button></div><p className="mt-3 text-xs text-muted-foreground">Confirm marks against the letter of credit, purchase order, packing list and destination requirements. Avoid printing confidential consignee details on external packages unless required.</p></>;
}

function Input({label,value,set,type="number"}:{label:string;value?:string;set:(value:string)=>void;type?:"number"|"text"|"date"}) { return <label className="text-sm">{label}<input type={type} min={type==="number"?"0":undefined} step={type==="number"?"any":undefined} className={`${field} mt-1`} value={value??""} onChange={(e)=>set(e.target.value)}/></label>; }
function Result({label,value,note}:{label:string;value:string;note?:string}) { return <div className="mt-5 rounded-xl bg-primary p-5 text-primary-foreground"><p className="text-sm opacity-75">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p>{note&&<p className="mt-2 text-xs leading-5 opacity-80">{note}</p>}</div>; }
function downloadText(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]??char));}
