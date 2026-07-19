"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TemplateDefinition } from "@/content/templates";

type Line = { description: string; quantity: string; unitPrice: string; cartons: string; netKg: string; grossKg: string; length: string; width: string; height: string };
const blankLine = (): Line => ({ description: "", quantity: "1", unitPrice: "", cartons: "", netKg: "", grossKg: "", length: "", width: "", height: "" });

function n(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function money(value: number) { return value.toLocaleString(undefined, { maximumFractionDigits: 2 }); }

export function TemplateBuilder({ template }: { template: TemplateDefinition }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const totals = useMemo(() => lines.reduce((sum, line) => ({
    cartons: sum.cartons + n(line.cartons), netKg: sum.netKg + n(line.netKg), grossKg: sum.grossKg + n(line.grossKg),
    amount: sum.amount + n(line.quantity) * n(line.unitPrice),
    cbm: sum.cbm + (n(line.length) * n(line.width) * n(line.height) * Math.max(1, n(line.cartons) || n(line.quantity))) / 1_000_000,
  }), { cartons: 0, netKg: 0, grossKg: 0, amount: 0, cbm: 0 }), [lines]);

  function setLine(index: number, key: keyof Line, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  }

  async function downloadPdf() {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.043, 0.122, 0.227) });
    page.drawText(template.name.toUpperCase(), { x: 42, y: 800, size: 18, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Prepared with GainingDocx — review before use", { x: 42, y: 782, size: 8, font: regular, color: rgb(.8, .85, .92) });
    let y = 744;
    for (const field of template.fields) {
      const value = values[field.key]?.trim();
      if (!value) continue;
      page.drawText(field.label.toUpperCase(), { x: 42, y, size: 7, font: regular, color: rgb(.3, .36, .45) });
      y -= 12;
      for (const row of value.split("\n").slice(0, 3)) { page.drawText(row.slice(0, 85), { x: 42, y, size: 10, font: bold, color: rgb(.043, .122, .227) }); y -= 13; }
      y -= 7;
    }
    y -= 4;
    page.drawText("LINES", { x: 42, y, size: 9, font: bold, color: rgb(.043, .122, .227) }); y -= 18;
    lines.filter((line) => line.description.trim()).slice(0, 15).forEach((line, i) => {
      const detail = `${i + 1}. ${line.description.slice(0, 48)}  Qty ${line.quantity || "—"}  Cartons ${line.cartons || "—"}  Gross ${line.grossKg || "—"} kg`;
      page.drawText(detail, { x: 42, y, size: 8, font: regular, color: rgb(.1, .16, .25) }); y -= 15;
    });
    page.drawText(`Totals: ${money(totals.cartons)} cartons | ${money(totals.netKg)} net kg | ${money(totals.grossKg)} gross kg | ${money(totals.cbm)} CBM | ${money(totals.amount)} value`, { x: 42, y: Math.max(48, y - 12), size: 8, font: bold, color: rgb(.043, .122, .227) });
    const bytes = await pdf.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${template.slug}.pdf`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          {template.fields.map((field) => {
            const cls = "min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm";
            return <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-sm font-medium">{field.label}</span>{field.type === "textarea" ? <textarea rows={3} className={cls} value={values[field.key] ?? ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} /> : <input type={field.type ?? "text"} placeholder={field.placeholder} className={cls} value={values[field.key] ?? ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />}</label>;
          })}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Cargo lines</h2><Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, blankLine()])}><Plus aria-hidden /> Add line</Button></div>
          <div className="space-y-4">
            {lines.map((line, index) => <div key={index} className="rounded-xl border bg-background p-3"><div className="mb-2 flex gap-2"><input aria-label={`Line ${index + 1} description`} placeholder="Description" className="min-h-11 min-w-0 flex-1 rounded-lg border bg-card px-3 text-sm" value={line.description} onChange={(e) => setLine(index, "description", e.target.value)} />{lines.length > 1 && <Button aria-label={`Remove line ${index + 1}`} variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 aria-hidden /></Button>}</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([['quantity','Qty'],['unitPrice','Unit price'],['cartons','Cartons'],['netKg','Net kg'],['grossKg','Gross kg'],['length','L cm'],['width','W cm'],['height','H cm']] as [keyof Line,string][]).map(([key,label]) => <label key={key} className="text-xs text-muted-foreground">{label}<input type="number" min="0" step="any" className="mt-1 min-h-11 w-full rounded-lg border bg-card px-2 text-foreground" value={line[key]} onChange={(e) => setLine(index, key, e.target.value)} /></label>)}</div></div>)}
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground lg:sticky lg:top-24"><h2 className="text-lg font-bold">Live totals</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="opacity-65">Cartons</dt><dd className="text-xl font-bold">{money(totals.cartons)}</dd></div><div><dt className="opacity-65">CBM</dt><dd className="text-xl font-bold">{money(totals.cbm)}</dd></div><div><dt className="opacity-65">Net kg</dt><dd className="text-xl font-bold">{money(totals.netKg)}</dd></div><div><dt className="opacity-65">Gross kg</dt><dd className="text-xl font-bold">{money(totals.grossKg)}</dd></div><div className="col-span-2"><dt className="opacity-65">Line value</dt><dd className="text-xl font-bold">{money(totals.amount)}</dd></div></dl><Button className="mt-6 w-full bg-signal text-signal-foreground hover:bg-signal/90" onClick={downloadPdf}><Download aria-hidden /> Download PDF</Button><div className="mt-3 grid grid-cols-2 gap-2"><a className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 text-sm font-medium" href={`/downloads/${template.slug}.xlsx`} download>XLSX</a><a className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 text-sm font-medium" href={`/downloads/${template.slug}.docx`} download>DOCX</a></div><p className="mt-3 text-xs opacity-65">Nothing is uploaded. This form runs in your browser.</p></aside>
    </div>
  );
}
