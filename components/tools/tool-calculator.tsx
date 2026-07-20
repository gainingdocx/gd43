"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Copy, Download, Plus, Search, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeCheckDigit, normalizeContainerNo, validateContainerNo } from "@/lib/validators/container";

const field = "min-h-12 w-full rounded-lg border bg-background px-3 py-2";
function num(v: string) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; }
function fmt(v: number, digits = 3) { return v.toLocaleString(undefined, { maximumFractionDigits: digits }); }

type CargoRow = { l: string; w: string; h: string; qty: string; weight: string; description: string };
const cargoRow = (): CargoRow => ({ l: "", w: "", h: "", qty: "1", weight: "", description: "" });

export function ToolCalculator({ slug }: { slug: string }) {
  let body: React.ReactNode;
  if (slug === "cbm-calculator") body = <CbmCalculator />;
  else if (slug === "container-load-calculator") body = <ContainerLoadCalculator />;
  else if (slug === "container-number-check") body = <ContainerNumberCheck />;
  else if (slug === "chargeable-weight-calculator") body = <ChargeableWeightCalculator />;
  else body = <PortLookup />;
  return <div><div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">{body}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-4"><p className="text-sm font-medium">Already have this data in a document?</p><Button render={<Link href="/app/scan" />} className="bg-signal text-signal-foreground hover:bg-signal/90">Auto-fill from your document <ArrowRight aria-hidden/></Button></div></div>;
}

function CbmCalculator() {
  const [rows, setRows] = useState<CargoRow[]>([cargoRow()]);
  const [unit, setUnit] = useState("cm");
  const factor = unit === "m" ? 1 : unit === "in" ? 0.000016387064 : unit === "mm" ? 0.000000001 : 0.000001;
  const calculated = rows.map((row) => ({ ...row, cbm: num(row.l) * num(row.w) * num(row.h) * num(row.qty) * factor, totalKg: num(row.weight) * num(row.qty) }));
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

const CONTAINERS: Record<string, { name: string; l: number; w: number; h: number; cbm: number; payload: number }> = {
  "20gp": { name: "20′ general purpose", l: 5.90, w: 2.35, h: 2.39, cbm: 33.1, payload: 28200 },
  "40gp": { name: "40′ general purpose", l: 12.03, w: 2.35, h: 2.39, cbm: 67.7, payload: 26700 },
  "40hc": { name: "40′ high cube", l: 12.03, w: 2.35, h: 2.69, cbm: 76.3, payload: 26460 },
  "45hc": { name: "45′ high cube", l: 13.55, w: 2.35, h: 2.69, cbm: 85.7, payload: 27700 },
};

function ContainerLoadCalculator() {
  const [v, setV] = useState<Record<string, string>>({ container: "40hc", unit: "cm", qty: "1", rotate: "yes" });
  const spec = CONTAINERS[v.container] ?? CONTAINERS["40hc"];
  const factor = v.unit === "in" ? 0.0254 : v.unit === "m" ? 1 : 0.01;
  const dims = [num(v.l) * factor, num(v.w) * factor, num(v.h) * factor];
  const orientations = v.rotate === "yes" ? permutations(dims) : [dims];
  const fits = orientations.map(([l,w,h]) => ({ l, w, h, count: l && w && h ? Math.floor(spec.l/l) * Math.floor(spec.w/w) * Math.floor(spec.h/h) : 0 })).sort((a,b) => b.count-a.count);
  const best = fits[0] ?? { l:0,w:0,h:0,count:0 };
  const requested = num(v.qty);
  const pieceKg = num(v.weight);
  const maxByWeight = pieceKg ? Math.floor(spec.payload / pieceKg) : Number.POSITIVE_INFINITY;
  const maxUnits = Math.min(best.count, maxByWeight);
  const containersNeeded = maxUnits > 0 ? Math.ceil(requested / maxUnits) : 0;
  const cargoCbm = dims[0] * dims[1] * dims[2] * requested;
  const cargoKg = pieceKg * requested;
  const update = (key:string,value:string) => setV((old)=>({...old,[key]:value}));
  const viable = requested > 0 && maxUnits > 0 && requested <= maxUnits;
  return <>
    <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm sm:col-span-2">Container<select className={`${field} mt-1`} value={v.container} onChange={(e)=>update("container",e.target.value)}>{Object.entries(CONTAINERS).map(([key,c])=><option key={key} value={key}>{c.name}</option>)}</select></label><label className="text-sm">Dimension unit<select className={`${field} mt-1`} value={v.unit} onChange={(e)=>update("unit",e.target.value)}><option value="cm">Centimetres</option><option value="m">Metres</option><option value="in">Inches</option></select></label></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Carton length" value={v.l} set={(x)=>update("l",x)} /><Input label="Carton width" value={v.w} set={(x)=>update("w",x)} /><Input label="Carton height" value={v.h} set={(x)=>update("h",x)} /><Input label="Carton quantity" value={v.qty} set={(x)=>update("qty",x)} /><Input label="Gross kg per carton" value={v.weight} set={(x)=>update("weight",x)} /><label className="text-sm">Allow 90° rotation<select className={`${field} mt-1`} value={v.rotate} onChange={(e)=>update("rotate",e.target.value)}><option value="yes">Yes</option><option value="no">No — keep orientation</option></select></label></div>
    <Result label={viable ? "Fits by simple orthogonal stowage" : "Estimated containers required"} value={viable ? `Yes — ${requested} of ${maxUnits} units` : containersNeeded ? `${containersNeeded} × ${spec.name}` : "Enter carton dimensions"} note={`Best grid orientation: ${fmt(best.l,2)} × ${fmt(best.w,2)} × ${fmt(best.h,2)} m. Spatial maximum ${best.count}; weight maximum ${Number.isFinite(maxByWeight)?maxByWeight:"not calculated"}. Cargo ${fmt(cargoCbm)} CBM / ${fmt(cargoKg,1)} kg versus nominal ${spec.cbm} CBM / ${spec.payload.toLocaleString()} kg payload.`}/>
    <p className="mt-3 text-xs text-muted-foreground">This is a deterministic identical-carton grid feasibility check. It accounts for internal dimensions, rotations and payload, but not door aperture, pallets, mixed SKU optimization, bracing, axle distribution or dangerous-goods segregation. Confirm the carrier’s equipment sheet and loading plan.</p>
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
  const [actual, setActual] = useState("");
  const [custom, setCustom] = useState("5000");
  const divisor = mode === "air6000" ? 6000 : mode === "custom" ? Math.max(1,num(custom)) : unit === "inlb" ? 139 : 5000;
  const set = (i:number,key:keyof CargoRow,value:string)=>setRows((old)=>old.map((r,x)=>x===i?{...r,[key]:value}:r));
  const detail = rows.map((r)=>({ ...r, volumetric: num(r.l)*num(r.w)*num(r.h)*num(r.qty)/divisor }));
  const volumetric = detail.reduce((s,r)=>s+r.volumetric,0);
  const chargeable = Math.max(num(actual),volumetric);
  const weightUnit = unit === "inlb" ? "lb" : "kg";
  return <><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Tariff basis<select className={`${field} mt-1`} value={mode} onChange={(e)=>setMode(e.target.value)}><option value="express5000">Express courier — 5,000 cm³/kg</option><option value="air6000">General air cargo — 6,000 cm³/kg</option><option value="custom">Custom carrier divisor</option></select></label><label className="text-sm">Units<select className={`${field} mt-1`} value={unit} onChange={(e)=>setUnit(e.target.value)}><option value="cmkg">cm / kg</option><option value="inlb">in / lb (139 divisor)</option></select></label>{mode==="custom"?<Input label="Custom divisor" value={custom} set={setCustom}/>:<Input label={`Total actual weight (${weightUnit})`} value={actual} set={setActual}/>}</div>{mode==="custom"&&<div className="mt-3 max-w-sm"><Input label={`Total actual weight (${weightUnit})`} value={actual} set={setActual}/></div>}
    <div className="mt-4 space-y-3">{detail.map((r,i)=><div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-6"><Input label="Length" value={r.l} set={(x)=>set(i,"l",x)}/><Input label="Width" value={r.w} set={(x)=>set(i,"w",x)}/><Input label="Height" value={r.h} set={(x)=>set(i,"h",x)}/><Input label="Pieces" value={r.qty} set={(x)=>set(i,"qty",x)}/><div className="flex items-end rounded-lg bg-accent p-2 text-sm"><span><span className="block text-xs text-muted-foreground">Volumetric</span><strong>{fmt(r.volumetric,1)} {weightUnit}</strong></span></div><div className="flex items-end">{rows.length>1&&<Button size="icon" variant="ghost" aria-label={`Remove package group ${i+1}`} onClick={()=>setRows(rows.filter((_,x)=>x!==i))}><Trash2/></Button>}</div></div>)}</div><Button className="mt-3" variant="outline" onClick={()=>setRows([...rows,cargoRow()])}><Plus/> Add package group</Button>
    <Result label="Chargeable weight" value={`${fmt(chargeable,1)} ${weightUnit}`} note={`Actual ${fmt(num(actual),1)} ${weightUnit}; volumetric ${fmt(volumetric,1)} ${weightUnit}; divisor ${divisor}. The greater figure is chargeable. Calculate each package group separately, then sum.`}/><p className="mt-3 text-xs text-muted-foreground">Carrier rules, minimums and rounding differ. Select the contracted tariff basis; do not use the express divisor for general air cargo or vice versa.</p></>;
}

function PortLookup() {
  const [q,setQ]=useState(""); const [ports,setPorts]=useState<{code:string;name:string}[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [searched,setSearched]=useState(false);
  async function search(){setLoading(true);setSearched(false);setError("");try{const response=await fetch(`/api/tools/port-lookup?q=${encodeURIComponent(q)}`);if(!response.ok)throw new Error();const data=await response.json() as {results?:{code:string;name:string}[]};setPorts(data.results??[]);setSearched(true);}catch{setPorts([]);setError("Port lookup is temporarily unavailable. Please try again.");}finally{setLoading(false);}}
  return <><div className="flex gap-2"><input aria-label="Port name or UN/LOCODE" className={field} placeholder="Port name or code, e.g. SGSIN" value={q} onChange={(e)=>{setQ(e.target.value);setSearched(false);}} onKeyDown={(e)=>{if(e.key==='Enter'&&q.trim().length>=2)void search()}}/><Button onClick={()=>void search()} disabled={loading||q.trim().length<2}><Search/>{loading?'Searching':'Search'}</Button></div>{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<ul className="mt-4 divide-y rounded-xl border bg-background">{ports.map((p)=><li key={p.code} className="flex items-center justify-between gap-4 p-3"><span>{p.name}</span><span className="flex items-center gap-2"><strong className="font-mono">{p.code}</strong><Button size="icon" variant="ghost" aria-label={`Copy ${p.code}`} onClick={()=>void navigator.clipboard.writeText(p.code)}><Copy className="size-4"/></Button></span></li>)}</ul>{searched&&!loading&&!error&&ports.length===0&&<p className="mt-4 text-sm text-muted-foreground">No maritime location matched. Try the city name without “Port of”, or the five-character code.</p>}</>;
}

function Input({label,value,set,type="number"}:{label:string;value?:string;set:(value:string)=>void;type?:"number"|"text"}) { return <label className="text-sm">{label}<input type={type} min={type==="number"?"0":undefined} step={type==="number"?"any":undefined} className={`${field} mt-1`} value={value??""} onChange={(e)=>set(e.target.value)}/></label>; }
function Result({label,value,note}:{label:string;value:string;note?:string}) { return <div className="mt-5 rounded-xl bg-primary p-5 text-primary-foreground"><p className="text-sm opacity-75">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p>{note&&<p className="mt-2 text-xs leading-5 opacity-80">{note}</p>}</div>; }
function permutations(values:number[]) { const [a,b,c]=values; return [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]].filter((row,index,all)=>all.findIndex((other)=>other.join("|")===row.join("|"))===index); }
function downloadText(name:string,text:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
