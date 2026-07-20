"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateContainerNo } from "@/lib/validators/container";

const field = "min-h-11 w-full rounded-lg border bg-background px-3 py-2";
function num(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export function ToolCalculator({ slug }: { slug: string }) {
  const [v, setV] = useState<Record<string, string>>({ qty: "1", unit: "cm", container: "40hc" });
  const [ports, setPorts] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [portError, setPortError] = useState("");
  const update = (key: string, value: string) => setV((old) => ({ ...old, [key]: value }));
  let body: React.ReactNode;
  if (slug === "cbm-calculator") {
    const factor = v.unit === "m" ? 1 : v.unit === "in" ? 0.000016387064 : 0.000001;
    const cbm = num(v.l) * num(v.w) * num(v.h) * num(v.qty) * factor;
    body = <><div className="grid gap-3 sm:grid-cols-2"><Input label="Length" value={v.l} set={(x)=>update('l',x)} /><Input label="Width" value={v.w} set={(x)=>update('w',x)} /><Input label="Height" value={v.h} set={(x)=>update('h',x)} /><Input label="Quantity" value={v.qty} set={(x)=>update('qty',x)} /><label className="text-sm">Unit<select className={`${field} mt-1`} value={v.unit} onChange={(e)=>update('unit',e.target.value)}><option value="cm">Centimetres</option><option value="m">Metres</option><option value="in">Inches</option></select></label></div><Result label="Total shipment volume" value={`${cbm.toFixed(3)} CBM`} /> </>;
  } else if (slug === "container-load-calculator") {
    const specs: Record<string,[number,number]> = { "20gp":[33.2,28200], "40gp":[67.7,26700], "40hc":[76.3,26460], "45hc":[86,27700] };
    const [capacity,payload]=specs[v.container] ?? specs['40hc']; const volume=num(v.cbm); const weight=num(v.weight); const pct=Math.max(volume/capacity,weight/payload)*100;
    body=<><label className="text-sm">Container<select className={`${field} mt-1`} value={v.container} onChange={(e)=>update('container',e.target.value)}><option value="20gp">20′ general purpose</option><option value="40gp">40′ general purpose</option><option value="40hc">40′ high cube</option><option value="45hc">45′ high cube</option></select></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label="Cargo volume (CBM)" value={v.cbm} set={(x)=>update('cbm',x)} /><Input label="Gross weight (kg)" value={v.weight} set={(x)=>update('weight',x)} /></div><Result label={pct<=100?"Estimated capacity used":"Nominal capacity exceeded"} value={`${pct.toFixed(1)}%`} note={`Nominal capacity ${capacity} CBM · payload ${payload.toLocaleString()} kg. Confirm carrier limits and physical loadability.`}/></>;
  } else if (slug === "container-number-check") {
    const normalized=(v.number??'').replace(/[\s-]/g,'').toUpperCase(); const valid=normalized.length===11 ? validateContainerNo("container_no", normalized) : null;
    body=<><label className="text-sm">Container number<input className={`${field} mt-1 font-mono uppercase`} maxLength={14} placeholder="MSCU 663987 1" value={v.number??''} onChange={(e)=>update('number',e.target.value)} /></label>{valid && <div className={`mt-5 rounded-xl border p-5 ${valid.status==='pass'?'border-success/30 bg-success/10':'border-destructive/30 bg-destructive/10'}`}>{valid.status==='pass'?<CheckCircle2 className="size-7 text-success"/>:<XCircle className="size-7 text-destructive"/>}<p className="mt-2 font-bold">{valid.message}</p>{valid.expected&&<p className="text-sm">Expected check digit: <strong>{valid.expected}</strong></p>}</div>}</>;
  } else if (slug === "chargeable-weight-calculator") {
    const actual=num(v.actual); const volume=num(v.volume); const airVol=volume*167; const charge=Math.max(actual,airVol);
    body=<><div className="grid gap-3 sm:grid-cols-2"><Input label="Actual gross weight (kg)" value={v.actual} set={(x)=>update('actual',x)} /><Input label="Volume (CBM)" value={v.volume} set={(x)=>update('volume',x)} /></div><Result label="Airfreight chargeable weight" value={`${charge.toFixed(1)} kg`} note={`Volumetric weight: ${airVol.toFixed(1)} kg using 1 CBM = 167 kg. Ocean LCL rules vary by tariff.`}/></>;
  } else {
    async function searchPorts() {
      setLoading(true);
      setPortError("");
      try {
        const response = await fetch(`/api/tools/port-lookup?q=${encodeURIComponent(v.q ?? "")}`);
        if (!response.ok) throw new Error(`Port lookup failed (${response.status})`);
        const data = await response.json() as { results?: { code: string; name: string }[] };
        setPorts(data.results ?? []);
      } catch {
        setPorts([]);
        setPortError("Port lookup is temporarily unavailable. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    body=<><div className="flex gap-2"><input aria-label="Port name or UN/LOCODE" className={field} placeholder="Port name or code, e.g. Singapore" value={v.q??''} onChange={(e)=>update('q',e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')void searchPorts()}}/><Button onClick={() => void searchPorts()} disabled={loading}><Search aria-hidden/>{loading?'Searching':'Search'}</Button></div>{portError&&<p role="alert" className="mt-3 text-sm text-destructive">{portError}</p>}<ul className="mt-4 divide-y rounded-xl border bg-background">{ports.map((p)=><li key={p.code} className="flex justify-between gap-4 p-3"><span>{p.name}</span><strong className="font-mono">{p.code}</strong></li>)}</ul></>;
  }
  return <div><div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">{body}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-4"><p className="text-sm font-medium">Already have this data in a document?</p><Button render={<Link href="/app/scan" />} className="bg-signal text-signal-foreground hover:bg-signal/90">Auto-fill from your document <ArrowRight aria-hidden/></Button></div></div>;
}

function Input({label,value,set}:{label:string;value?:string;set:(value:string)=>void}) { return <label className="text-sm">{label}<input type="number" min="0" step="any" className={`${field} mt-1`} value={value??''} onChange={(e)=>set(e.target.value)}/></label>; }
function Result({label,value,note}:{label:string;value:string;note?:string}) { return <div className="mt-5 rounded-xl bg-primary p-5 text-primary-foreground"><p className="text-sm opacity-70">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p>{note&&<p className="mt-2 text-xs opacity-70">{note}</p>}</div>; }
