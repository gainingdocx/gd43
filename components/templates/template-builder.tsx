"use client";

import { useMemo, useState } from "react";
import "regenerator-runtime/runtime";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TemplateDefinition, TemplateLineKey } from "@/content/templates";
import { pdfFontRuns, shapePdfText } from "@/lib/export/pdf-text";

type Line = Record<TemplateLineKey, string>;

const ALL_LINE_KEYS: TemplateLineKey[] = [
  "description", "sku", "hsCode", "origin", "marks", "packageType", "quantity", "uom",
  "cartons", "packages", "unitPrice", "amount", "netKg", "grossKg", "length", "width",
  "height", "cbm", "container", "seal", "status", "charges",
];

function blankLine(): Line {
  return Object.fromEntries(ALL_LINE_KEYS.map((key) => [key, ""])) as Line;
}

function n(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function lineAmount(line: Line) {
  return line.amount.trim() === "" ? n(line.quantity) * n(line.unitPrice) : n(line.amount);
}

function lineCbm(line: Line) {
  if (line.cbm.trim() !== "") return n(line.cbm);
  const count = n(line.cartons) || n(line.packages) || 1;
  return n(line.length) * n(line.width) * n(line.height) * count / 1_000_000;
}

function lineHasData(line: Line) {
  return Object.values(line).some((value) => value.trim() !== "");
}

export function TemplateBuilder({ template, sectionHeadings }: { template: TemplateDefinition; sectionHeadings?: string[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [pdfReady, setPdfReady] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const invoiceLike = template.slug === "commercial-invoice-template" || template.slug === "pro-forma-invoice-template";

  const totals = useMemo(() => lines.reduce((sum, line) => ({
    cartons: sum.cartons + n(line.cartons),
    packages: sum.packages + n(line.packages),
    netKg: sum.netKg + n(line.netKg),
    grossKg: sum.grossKg + n(line.grossKg),
    amount: sum.amount + lineAmount(line),
    cbm: sum.cbm + lineCbm(line),
    charges: sum.charges + n(line.charges),
  }), { cartons: 0, packages: 0, netKg: 0, grossKg: 0, amount: 0, cbm: 0, charges: 0 }), [lines]);

  const errors = useMemo(() => {
    const out: string[] = [];
    for (const field of template.fields) {
      if (field.required && !(values[field.key] ?? "").trim()) out.push(`${field.label} is required.`);
    }
    const active = lines.filter(lineHasData);
    if (active.length === 0) out.push(`Add at least one ${template.lineTitle.toLowerCase()} row.`);
    active.forEach((line, index) => {
      if (line.netKg && line.grossKg && n(line.grossKg) < n(line.netKg)) {
        out.push(`Row ${index + 1}: gross weight cannot be lower than net weight.`);
      }
      const dims = [line.length, line.width, line.height].filter((v) => v.trim() !== "").length;
      if (dims > 0 && dims < 3) out.push(`Row ${index + 1}: enter all three dimensions or none.`);
    });
    if (invoiceLike && !(values.currency ?? "").match(/^[A-Za-z]{3}$/)) {
      out.push("Invoice currency must be a three-letter ISO code.");
    }
    return out;
  }, [invoiceLike, lines, template, values]);

  const sections = useMemo(() => {
    const result = new Map<string, typeof template.fields>();
    for (const field of template.fields) result.set(field.section, [...(result.get(field.section) ?? []), field]);
    return [...result.entries()];
  }, [template]);

  function setLine(index: number, key: TemplateLineKey, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  }

  async function downloadPdf() {
    setAttempted(true);
    setPdfReady(false);
    if (errors.length > 0) return;

    const [{ PDFDocument, StandardFonts, rgb }, fontkit] = await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
    ]);
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit.default);
    const usesUnicode = [...Object.values(values), ...lines.flatMap((line) => Object.values(line))]
      .some((value) => /[^\u0000-\u00ff]/.test(value));
    const usesDevanagari = [...Object.values(values), ...lines.flatMap((line) => Object.values(line))]
      .some((value) => /[\u0900-\u097f]/.test(value));
    let regular = await pdf.embedFont(StandardFonts.Helvetica);
    let bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let devanagari = regular;
    if (usesUnicode) {
      const response = await fetch("/fonts/unifont.ttf");
      if (!response.ok) throw new Error("The Unicode PDF font could not be loaded.");
      const bytes = await response.arrayBuffer();
      regular = await pdf.embedFont(bytes, { subset: true });
      bold = regular;
    }
    if (usesDevanagari) {
      const response = await fetch("/fonts/noto-sans-devanagari.woff");
      if (!response.ok) throw new Error("The Devanagari PDF font could not be loaded.");
      devanagari = await pdf.embedFont(await response.arrayBuffer(), { subset: true });
    }
    const navy = rgb(0.004, 0.231, 0.702);
    const red = rgb(0.831, 0.02, 0.02);
    const ink = rgb(0.08, 0.13, 0.22);
    const gray = rgb(0.38, 0.43, 0.5);
    const pale = rgb(0.94, 0.97, 1);
    const pageSize: [number, number] = [842, 595];
    const margin = 36;
    let pageNo = 0;
    let page = pdf.addPage(pageSize);
    let y = 0;

    const wrap = (text: string, maxWidth: number, size: number, font = regular) => {
      const rows: string[] = [];
      for (const paragraph of text.replace(/\r/g, "").split("\n")) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (words.length === 0) { rows.push(""); continue; }
        let row = "";
        for (const word of words) {
          const candidate = row ? `${row} ${word}` : word;
          const width = font === regular
            ? pdfFontRuns(shapePdfText(candidate)).reduce((sum, run) =>
                sum + (run.script === "devanagari" ? devanagari : regular).widthOfTextAtSize(run.text, size), 0)
            : font.widthOfTextAtSize(shapePdfText(candidate), size);
          if (width <= maxWidth) row = candidate;
          else { if (row) rows.push(row); row = word; }
        }
        if (row) rows.push(row);
      }
      return rows.map(shapePdfText);
    };

    const drawUserText = (
      value: string,
      options: NonNullable<Parameters<typeof page.drawText>[1]>
    ) => {
      let x = options.x ?? 0;
      for (const run of pdfFontRuns(value)) {
        const runFont = run.script === "devanagari" ? devanagari : regular;
        page.drawText(run.text, { ...options, x, font: runFont });
        x += runFont.widthOfTextAtSize(run.text, options.size ?? 12);
      }
    };

    const startPage = (continuation = false) => {
      if (pageNo > 0) page = pdf.addPage(pageSize);
      pageNo += 1;
      page.drawRectangle({ x: 0, y: 533, width: 842, height: 62, color: navy });
      page.drawRectangle({ x: 0, y: 529, width: 842, height: 4, color: red });
      page.drawText(template.name.toUpperCase(), { x: margin, y: 562, size: 17, font: bold, color: rgb(1, 1, 1) });
      page.drawText(continuation ? "CONTINUED" : template.purpose, { x: margin, y: 544, size: 7.5, font: regular, color: rgb(.84, .89, .98) });
      y = 510;
    };

    const ensure = (height: number) => {
      if (y - height < 47) startPage(true);
    };

    startPage();
    const notice = wrap(template.authorityNotice, 770, 8.5, bold);
    page.drawRectangle({ x: margin, y: y - notice.length * 11 - 12, width: 770, height: notice.length * 11 + 18, color: rgb(1, .95, .95) });
    page.drawText("IMPORTANT", { x: margin + 9, y: y - 3, size: 7, font: bold, color: red });
    notice.forEach((row, index) => page.drawText(row, { x: margin + 70, y: y - 3 - index * 11, size: 8.5, font: bold, color: ink }));
    y -= notice.length * 11 + 28;

    for (const [sectionName, fields] of sections) {
      const populated = fields.filter((field) => (values[field.key] ?? "").trim());
      if (populated.length === 0) continue;
      const boxes = populated.map((field) => ({ field, rows: wrap(values[field.key].trim(), 355, 8.5) }));
      for (let index = 0; index < boxes.length; index += 2) {
        const pair = boxes.slice(index, index + 2);
        const height = Math.max(...pair.map((box) => 19 + box.rows.length * 10)) + 8;
        ensure(height + (index === 0 ? 18 : 0));
        if (index === 0) {
          page.drawText(sectionName.toUpperCase(), { x: margin, y, size: 8, font: bold, color: navy });
          y -= 14;
        }
        pair.forEach((box, col) => {
          const x = margin + col * 386;
          page.drawRectangle({ x, y: y - height + 5, width: 374, height, color: pale });
          page.drawText(box.field.label.toUpperCase(), { x: x + 8, y: y - 8, size: 6.5, font: bold, color: gray });
          box.rows.forEach((row, rowIndex) => drawUserText(row, { x: x + 8, y: y - 21 - rowIndex * 10, size: 8.5, color: ink }));
        });
        y -= height + 5;
      }
      y -= 4;
    }

    const activeLines = lines.filter(lineHasData);
    if (activeLines.length > 0) {
      ensure(58);
      page.drawText(template.lineTitle.toUpperCase(), { x: margin, y, size: 9, font: bold, color: navy });
      y -= 18;
      const totalWeight = template.lineColumns.reduce((sum, col) => sum + (col.width ?? 1), 0);
      const widths = template.lineColumns.map((col) => 770 * (col.width ?? 1) / totalWeight);
      const drawHeader = () => {
        ensure(30);
        page.drawRectangle({ x: margin, y: y - 17, width: 770, height: 22, color: navy });
        let x = margin + 3;
        template.lineColumns.forEach((col, index) => {
          page.drawText(col.label, { x, y: y - 10, size: 6.5, font: bold, color: rgb(1, 1, 1) });
          x += widths[index];
        });
        y -= 23;
      };
      drawHeader();
      activeLines.forEach((line, rowIndex) => {
        const cellRows = template.lineColumns.map((col, colIndex) => {
          let value = line[col.key];
          if (col.key === "amount" && value.trim() === "") value = lineAmount(line) ? String(lineAmount(line)) : "";
          if (col.key === "cbm" && value.trim() === "") value = lineCbm(line) ? String(Math.round(lineCbm(line) * 1000) / 1000) : "";
          return wrap(value, widths[colIndex] - 6, 6.8);
        });
        const rowHeight = Math.max(17, Math.max(...cellRows.map((rows) => rows.length || 1)) * 9 + 6);
        if (y - rowHeight < 47) { startPage(true); drawHeader(); }
        if (rowIndex % 2 === 1) page.drawRectangle({ x: margin, y: y - rowHeight + 3, width: 770, height: rowHeight, color: pale });
        let x = margin + 3;
        cellRows.forEach((rows, colIndex) => {
          (rows.length ? rows : [""]).forEach((row, textIndex) => drawUserText(row, { x, y: y - 8 - textIndex * 9, size: 6.8, color: ink }));
          x += widths[colIndex];
        });
        y -= rowHeight;
      });
    }

    const chargeTotal = n(values.freight) + n(values.insurance) + n(values.otherCharges)
      + n(values.freightCharges) + n(values.terminalCharges);
    const invoiceTotal = totals.amount + chargeTotal;
    ensure(88);
    y -= 12;
    page.drawRectangle({ x: 500, y: y - 65, width: 306, height: 75, color: pale });
    const totalRows = [
      ["Packages / cartons", money(totals.packages || totals.cartons)],
      ["Net / gross kg", `${money(totals.netKg)} / ${money(totals.grossKg)}`],
      ["Total CBM", money(totals.cbm)],
      [invoiceLike ? "Invoice total" : "Line value / charges", money(invoiceLike ? invoiceTotal : totals.amount + totals.charges + chargeTotal)],
    ];
    totalRows.forEach(([label, value], index) => {
      page.drawText(label, { x: 510, y: y - index * 16, size: 8, font: regular, color: gray });
      page.drawText(value, { x: 680, y: y - index * 16, size: 9, font: bold, color: navy });
    });

    const pages = pdf.getPages();
    pages.forEach((pdfPage, index) => {
      pdfPage.drawLine({ start: { x: margin, y: 34 }, end: { x: 806, y: 34 }, thickness: .5, color: rgb(.75, .8, .88) });
      pdfPage.drawText(`Generated with GainingDocx · Page ${index + 1} of ${pages.length} · Review and authorize before use`, { x: margin, y: 20, size: 7, font: regular, color: gray });
    });

    const bytes = await pdf.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.slug}-${values.invoiceNumber || values.blNumber || values.orderNumber || "draft"}.pdf`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
    setPdfReady(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-7 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">Authority and use</p>
          <p className="mt-1 leading-6">{template.authorityNotice}</p>
        </div>
        {sections.map(([sectionName, fields]) => (
          <fieldset key={sectionName} className="space-y-4">
            <legend className="text-lg font-bold text-primary">{sectionName}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const cls = "min-h-12 w-full rounded-lg border bg-background px-3 py-2 text-sm";
                const invalid = attempted && field.required && !(values[field.key] ?? "").trim();
                return <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-1.5 block text-sm font-medium">{field.label}{field.required && <span className="ml-1 text-red-600">*</span>}</span>
                  {field.type === "textarea" ?
                    <textarea rows={4} className={`${cls} ${invalid ? "border-red-500" : ""}`} placeholder={field.placeholder} value={values[field.key] ?? ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} /> :
                    <input type={field.type === "text" ? "text" : field.type ?? "text"} placeholder={field.placeholder} className={`${cls} ${invalid ? "border-red-500" : ""}`} value={values[field.key] ?? ""} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />}
                  {field.help && <span className="mt-1 block text-xs text-muted-foreground">{field.help}</span>}
                </label>;
              })}
            </div>
          </fieldset>
        ))}

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold text-primary">{sectionHeadings?.[0] ?? template.lineTitle}</h2><p className="text-xs text-muted-foreground">Add one row per item, package group or container as appropriate.</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, blankLine()])}><Plus aria-hidden /> Add row</Button>
          </div>
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="rounded-xl border bg-background p-3">
                <div className="mb-3 flex items-center justify-between"><strong className="text-sm">Row {index + 1}</strong>{lines.length > 1 && <Button aria-label={`Remove row ${index + 1}`} variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 aria-hidden /></Button>}</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {template.lineColumns.map((column) => (
                    <label key={column.key} className={column.key === "description" || column.key === "status" ? "col-span-2" : ""}>
                      <span className="text-xs text-muted-foreground">{column.label}</span>
                      <input type={column.type ?? "text"} min={column.type === "number" ? "0" : undefined} step={column.type === "number" ? "any" : undefined} className="mt-1 min-h-11 w-full rounded-lg border bg-card px-2 text-sm text-foreground" value={line[column.key]} onChange={(e) => setLine(index, column.key, e.target.value)} />
                    </label>
                  ))}
                </div>
                {(template.lineColumns.some((c) => c.key === "amount") || template.lineColumns.some((c) => c.key === "cbm")) && <p className="mt-3 text-xs text-muted-foreground">Calculated row amount: {money(lineAmount(line))} · calculated CBM: {money(lineCbm(line))}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">{sectionHeadings?.[1] ?? "Document checks"}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="opacity-65">Packages</dt><dd className="text-xl font-bold">{money(totals.packages || totals.cartons)}</dd></div>
          <div><dt className="opacity-65">CBM</dt><dd className="text-xl font-bold">{money(totals.cbm)}</dd></div>
          <div><dt className="opacity-65">Net kg</dt><dd className="text-xl font-bold">{money(totals.netKg)}</dd></div>
          <div><dt className="opacity-65">Gross kg</dt><dd className="text-xl font-bold">{money(totals.grossKg)}</dd></div>
          <div className="col-span-2"><dt className="opacity-65">Line value</dt><dd className="text-xl font-bold">{money(totals.amount)}</dd></div>
        </dl>
        {attempted && errors.length > 0 && <div role="alert" className="mt-5 rounded-lg bg-white p-3 text-sm text-red-700"><p className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4" /> Fix before download</p><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {attempted && errors.length === 0 && <p className="mt-4 flex items-center gap-2 text-sm"><CheckCircle2 className="size-4" /> Required checks passed</p>}
        <Button className="mt-6 w-full bg-signal text-signal-foreground hover:bg-signal/90" onClick={() => void downloadPdf()}><Download aria-hidden /> Validate & download PDF</Button>
        {pdfReady && <p role="status" className="mt-3 text-center text-sm font-semibold">Multi-page PDF prepared — check your downloads.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2"><a className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 text-sm font-medium" href={`/downloads/${template.slug}.xlsx`} download>XLSX</a><a className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 text-sm font-medium" href={`/downloads/${template.slug}.docx`} download>DOCX</a></div>
        <p className="mt-3 text-xs opacity-70">The form runs locally in your browser. Static files are document-specific working templates.</p>
        <div className="mt-5 border-t border-white/20 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-sky-200">Recommended next step</p><p className="mt-2 text-sm">{templateNextStep(template.slug).label}</p><Button render={<Link href={templateNextStep(template.slug).href} />} className="mt-3 w-full bg-white text-primary hover:bg-white/90">Continue workflow</Button></div>
      </aside>
    </div>
  );
}

function templateNextStep(slug: string) {
  const steps: Record<string, { label: string; href: string }> = {
    "commercial-invoice-template": { label: "Create the matching packing list, then cross-check value, quantity, weight and references.", href: "/templates/packing-list-template" },
    "pro-forma-invoice-template": { label: "When the sale is final, create the customs-facing commercial invoice.", href: "/templates/commercial-invoice-template" },
    "packing-list-template": { label: "Parse the B/L and verify package, weight, container and seal evidence.", href: "/bill-of-lading-parser" },
    "simple-packing-list-template": { label: "Need package-level audit detail? Continue with the detailed packing list.", href: "/templates/packing-list-template" },
    "container-packing-list-template": { label: "Carry verified equipment details into carrier shipping instructions.", href: "/templates/shipping-instructions-template" },
    "shipping-instructions-template": { label: "When the carrier sends its draft, parse and compare the issued B/L.", href: "/bill-of-lading-parser" },
    "certificate-of-origin-template": { label: "Check whether chamber certification or a destination-specific origin form is required.", href: "/templates/commercial-invoice-template" },
    "air-waybill-template": { label: "Verify chargeable weight before the carrier issues the final air waybill.", href: "/tools/chargeable-weight-calculator" },
    "arrival-notice-template": { label: "Audit free time and time-based charges before arranging cargo release.", href: "/tools/demurrage-detention-calculator" },
    "delivery-order-template": { label: "Confirm customs, payment and carrier-release conditions before pickup.", href: "/app/scan" },
    "bill-of-lading-template": { label: "Submit consistent shipping instructions and later compare the carrier draft.", href: "/templates/shipping-instructions-template" },
  };
  return steps[slug] ?? { label: "Parse the related documents and verify all shared references.", href: "/app/scan" };
}
