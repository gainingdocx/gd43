"use client";

import { useEffect, useState } from "react";
import { Download, FileUp, Plus, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auditFreeTime, type ChargePhase, type FreeTimeContainer, type PhaseTariff } from "@/lib/tools/demurrage-audit";

const field = "min-h-11 w-full rounded-lg border bg-background px-3 py-2";
const phases: ChargePhase[] = ["demurrage", "detention", "storage"];
const phaseLabel: Record<ChargePhase, string> = { demurrage: "Demurrage", detention: "Detention", storage: "Terminal storage" };
const n = (value: string | number | undefined) => Math.max(0, Number(value) || 0);
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const phaseEvents = () => ({ start: "", end: "", billedAmount: 0 });
const containerRow = (): FreeTimeContainer => ({ containerNo: "", demurrage: phaseEvents(), detention: phaseEvents(), storage: phaseEvents() });
const defaultTariff = (): PhaseTariff => ({ freeDays: 5, fixedCharges: 0, tiers: [{ days: 5, dailyRate: 0 }, { days: null, dailyRate: 0 }] });

export function DemurrageAuditCalculator() {
  const [containers, setContainers] = useState<FreeTimeContainer[]>([containerRow()]);
  const [tariffs, setTariffs] = useState<Record<ChargePhase, PhaseTariff>>({ demurrage: defaultTariff(), detention: defaultTariff(), storage: { ...defaultTariff(), freeDays: 0 } });
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("Local terminal time");
  const [dayBasis, setDayBasis] = useState<"calendar" | "working">("calendar");
  const [includeStartDate, setIncludeStartDate] = useState(false);
  const [holidayText, setHolidayText] = useState("");
  const [holidayCountry, setHolidayCountry] = useState("SG");
  const [holidayYear, setHolidayYear] = useState(String(new Date().getFullYear()));
  const [holidayStatus, setHolidayStatus] = useState("");
  const [arrivalImport, setArrivalImport] = useState<{ availability: string | null; lastFreeDay: string } | null>(null);
  const holidays = holidayText.split(/[\s,;]+/).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
  const audit = auditFreeTime({ containers, tariffs, currency, timezone, dayBasis, includeStartDate, holidays });

  async function loadCountryHolidays() {
    setHolidayStatus("Loading calendarâ€¦");
    const response = await fetch(`/api/tools/holidays?country=${encodeURIComponent(holidayCountry)}&year=${encodeURIComponent(holidayYear)}`);
    const data = await response.json() as { holidays?: Array<{ date: string; name: string }>; error?: string };
    if (!response.ok || !data.holidays) { setHolidayStatus(data.error ?? "Calendar unavailable"); return; }
    setHolidayText((current) => [...new Set([...current.split(/[\s,;]+/).filter(Boolean), ...data.holidays!.map((item) => item.date)])].sort().join(" "));
    setHolidayStatus(`${data.holidays.length} public holidays loaded; verify port and terminal closures separately.`);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const container = params.get("container");
    const availability = params.get("availability");
    const lastFreeDay = params.get("last_free_day");
    const zone = params.get("timezone");
    if (container || availability) setContainers((rows) => rows.map((row, index) => index ? row : { ...row, containerNo: container ?? row.containerNo, demurrage: { ...row.demurrage, start: availability ?? row.demurrage.start } }));
    if (lastFreeDay) {
      setArrivalImport({ availability, lastFreeDay });
      if (availability) {
        const start = Date.parse(`${availability.slice(0, 10)}T00:00:00Z`);
        const end = Date.parse(`${lastFreeDay.slice(0, 10)}T00:00:00Z`);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) setTariffs((old) => ({ ...old, demurrage: { ...old.demurrage, freeDays: Math.round((end - start) / 86_400_000) } }));
      }
    }
    if (zone) setTimezone(zone);
  }, []);

  const setContainer = (index: number, key: "containerNo" | ChargePhase, subkey: "start" | "end" | "billedAmount" | null, value: string) => setContainers((rows) => rows.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (key === "containerNo") return { ...row, containerNo: value };
    return { ...row, [key]: { ...row[key], [subkey!]: subkey === "billedAmount" ? n(value) : value } };
  }));
  const setTariff = (phase: ChargePhase, next: PhaseTariff) => setTariffs((old) => ({ ...old, [phase]: next }));

  function importTariff(file: File) {
    void file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as Partial<Record<ChargePhase, Partial<PhaseTariff>>>;
        setTariffs((old) => Object.fromEntries(phases.map((phase) => {
          const value = parsed[phase];
          return [phase, value ? { freeDays: n(value.freeDays), fixedCharges: n(value.fixedCharges), tiers: Array.isArray(value.tiers) && value.tiers.length ? value.tiers.map((tier) => ({ days: tier.days === null ? null : n(tier.days), dailyRate: n(tier.dailyRate) })) : old[phase].tiers } : old[phase]];
        })) as Record<ChargePhase, PhaseTariff>);
      } catch {
        const rows = text.split(/\r?\n/).slice(1).map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
        setTariffs((old) => {
          const next = structuredClone(old);
          for (const [phase, freeDays, tierDays, dailyRate, fixedCharges] of rows) if (phases.includes(phase as ChargePhase)) {
            const key = phase as ChargePhase;
            next[key].freeDays = n(freeDays); next[key].fixedCharges = n(fixedCharges);
            next[key].tiers.push({ days: tierDays ? n(tierDays) : null, dailyRate: n(dailyRate) });
          }
          return next;
        });
      }
    });
  }

  function exportCsv() {
    const header = "Container,Charge type,Start timestamp,End timestamp,Timezone,Elapsed days,Free days,Last free day,Chargeable days,Tier breakdown,Expected,Billed,Variance,Currency";
    const rows = audit.rows.map((row) => [row.containerNo, phaseLabel[row.phase], row.start, row.end, timezone, row.elapsedDays, row.freeDays, row.lastFreeDay ?? "", row.chargeableDays, row.tierBreakdown.map((tier) => `${tier.days}d@${tier.dailyRate}`).join(" | "), row.expectedAmount, row.billedAmount, row.variance, currency].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    download("free-time-dispute-audit.csv", [header, ...rows].join("\n"), "text/csv");
  }

  function printReport() {
    const rows = audit.rows.map((row) => `<tr><td>${escape(row.containerNo || "Not entered")}</td><td>${phaseLabel[row.phase]}</td><td>${escape(row.start)} â†’ ${escape(row.end)}</td><td>${row.elapsedDays}</td><td>${row.freeDays}</td><td>${row.lastFreeDay ?? "â€”"}</td><td>${row.chargeableDays}</td><td>${currency} ${money(row.expectedAmount)}</td><td>${currency} ${money(row.billedAmount)}</td><td>${currency} ${money(row.variance)}</td></tr>`).join("");
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>D&D dispute audit</title><style>@page{size:A4 landscape;margin:12mm}body{font:12px Arial;color:#071b4e}h1{margin:0}p{color:#475569}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#071b4e;color:white}.summary{margin-top:16px;font-size:16px;font-weight:bold}.warning{margin-top:20px;font-size:10px}</style></head><body><h1>Demurrage, detention & storage audit</h1><p>Generated ${escape(audit.generatedAt)} Â· ${escape(timezone)} Â· ${dayBasis} days Â· ${includeStartDate ? "inclusive" : "exclusive"} start Â· holidays ${holidays.join(", ") || "none entered"}</p><table><thead><tr><th>Container</th><th>Period</th><th>Events</th><th>Days</th><th>Free</th><th>Last free</th><th>Billable</th><th>Expected</th><th>Billed</th><th>Variance</th></tr></thead><tbody>${rows}</tbody></table><div class="summary">Expected ${currency} ${money(audit.expectedTotal)} Â· Billed ${currency} ${money(audit.billedTotal)} Â· Amount questioned ${currency} ${money(audit.variance)}</div><p class="warning">Working audit, not a carrier tariff or legal determination. Attach the governing tariff, event evidence, holiday calendar and invoice before sending a dispute.</p></body></html>`);
    win.document.close(); win.addEventListener("load", () => win.print());
  }

  return <div className="space-y-5">
    {arrivalImport && <section className="rounded-xl border border-[#f4c400]/70 bg-[#fffdf2] p-3 text-sm"><p className="font-bold text-primary">Arrival notice imported</p><p className="mt-1 text-xs text-muted-foreground">Printed last free day: {arrivalImport.lastFreeDay}{arrivalImport.availability ? ` · availability: ${arrivalImport.availability} · calendar free days prefilled` : " · add the governing start event and free-day rule"}. Add the actual gate/return event before relying on the calculation.</p></section>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm">Currency<input className={`${field} mt-1 uppercase`} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}/></label>
      <label className="text-sm lg:col-span-2">Event timezone<input className={`${field} mt-1`} value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Singapore or UTC+08:00"/></label>
      <label className="text-sm">Tariff day basis<select className={`${field} mt-1`} value={dayBasis} onChange={(e) => setDayBasis(e.target.value as "calendar" | "working")}><option value="calendar">Calendar days</option><option value="working">Working days</option></select></label>
      <label className="text-sm">Start convention<select className={`${field} mt-1`} value={includeStartDate ? "inclusive" : "exclusive"} onChange={(e) => setIncludeStartDate(e.target.value === "inclusive")}><option value="exclusive">Exclude start date</option><option value="inclusive">Include start date</option></select></label>
    </section>
    <section className="rounded-xl border p-3"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs">Country code<input className={`${field} mt-1 uppercase`} maxLength={2} value={holidayCountry} onChange={(e) => setHolidayCountry(e.target.value.toUpperCase())} placeholder="SG"/></label><label className="text-xs">Calendar year<input className={`${field} mt-1`} type="number" min="2020" max="2035" value={holidayYear} onChange={(e) => setHolidayYear(e.target.value)}/></label><Button variant="outline" className="self-end" onClick={() => void loadCountryHolidays()}>Load public holidays</Button></div>{holidayStatus && <p className="mt-2 text-xs text-muted-foreground">{holidayStatus}</p>}<label className="mt-3 block text-sm">Applied country/port holidays and closures (YYYY-MM-DD)<textarea className={`${field} mt-1 min-h-20`} value={holidayText} onChange={(e) => setHolidayText(e.target.value)} placeholder="2026-01-01 2026-05-01"/></label></section>

    <section><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-primary">Carrier tariff</h3><p className="text-xs text-muted-foreground">Add as many tiers as the governing tariff requires. The final blank-days tier applies to all remaining days.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><FileUp className="size-4"/> Import tariff JSON/CSV<input type="file" accept=".json,.csv,application/json,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && importTariff(e.target.files[0])}/></label></div>
      <div className="mt-3 grid gap-3 xl:grid-cols-3">{phases.map((phase) => <div key={phase} className="rounded-xl border p-3"><h4 className="font-semibold">{phaseLabel[phase]}</h4><div className="mt-2 grid grid-cols-2 gap-2"><SmallInput label="Free days" value={tariffs[phase].freeDays} set={(value) => setTariff(phase, { ...tariffs[phase], freeDays: n(value) })}/><SmallInput label="Fixed charges" value={tariffs[phase].fixedCharges} set={(value) => setTariff(phase, { ...tariffs[phase], fixedCharges: n(value) })}/></div><div className="mt-3 space-y-2">{tariffs[phase].tiers.map((tier, index) => <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}><SmallInput label={`Tier ${index + 1} days`} placeholder="Remainder" value={tier.days ?? ""} set={(value) => setTariff(phase, { ...tariffs[phase], tiers: tariffs[phase].tiers.map((old, i) => i === index ? { ...old, days: value === "" ? null : n(value) } : old) })}/><SmallInput label="Daily rate" value={tier.dailyRate} set={(value) => setTariff(phase, { ...tariffs[phase], tiers: tariffs[phase].tiers.map((old, i) => i === index ? { ...old, dailyRate: n(value) } : old) })}/><Button size="icon" variant="ghost" aria-label={`Remove ${phase} tier ${index + 1}`} disabled={tariffs[phase].tiers.length === 1} onClick={() => setTariff(phase, { ...tariffs[phase], tiers: tariffs[phase].tiers.filter((_, i) => i !== index) })}><Trash2/></Button></div>)}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => setTariff(phase, { ...tariffs[phase], tiers: [...tariffs[phase].tiers, { days: null, dailyRate: 0 }] })}><Plus/> Add tier</Button></div>)}</div>
    </section>

    <section><div className="flex items-center justify-between"><div><h3 className="font-bold text-primary">Container events and billed amounts</h3><p className="text-xs text-muted-foreground">Record exact carrier/terminal timestamps; the tariff is calculated by eligible calendar dates.</p></div><Button variant="outline" onClick={() => setContainers((rows) => [...rows, containerRow()])}><Plus/> Add container</Button></div><div className="mt-3 space-y-3">{containers.map((container, index) => <div key={index} className="rounded-xl border p-3"><div className="flex items-end gap-2"><label className="flex-1 text-sm">Container number<input className={`${field} mt-1 font-mono uppercase`} value={container.containerNo} onChange={(e) => setContainer(index, "containerNo", null, e.target.value)}/></label>{containers.length > 1 && <Button size="icon" variant="ghost" aria-label={`Remove container ${index + 1}`} onClick={() => setContainers((rows) => rows.filter((_, i) => i !== index))}><Trash2/></Button>}</div><div className="mt-3 space-y-2">{phases.map((phase) => <div key={phase} className="grid gap-2 rounded-lg bg-accent p-2 sm:grid-cols-4"><span className="self-center text-sm font-semibold">{phaseLabel[phase]}</span><SmallInput type="datetime-local" label="Start event" value={container[phase].start} set={(value) => setContainer(index, phase, "start", value)}/><SmallInput type="datetime-local" label="End event" value={container[phase].end} set={(value) => setContainer(index, phase, "end", value)}/><SmallInput label={`Billed (${currency})`} value={container[phase].billedAmount ?? 0} set={(value) => setContainer(index, phase, "billedAmount", value)}/></div>)}</div></div>)}</div></section>

    <section className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-primary text-primary-foreground"><tr><th className="p-3">Container / period</th><th className="p-3">Days</th><th className="p-3">Free / last free</th><th className="p-3">Chargeable</th><th className="p-3">Expected</th><th className="p-3">Billed</th><th className="p-3">Variance</th></tr></thead><tbody className="divide-y">{audit.rows.map((row) => <tr key={`${row.containerNo}-${row.phase}`}><td className="p-3"><strong className="font-mono">{row.containerNo || "Not entered"}</strong><span className="block text-xs text-muted-foreground">{phaseLabel[row.phase]}</span></td><td className="p-3">{row.elapsedDays}</td><td className="p-3">{row.freeDays}<span className="block text-xs text-muted-foreground">{row.lastFreeDay ?? "No calculated date"}</span></td><td className="p-3">{row.chargeableDays}</td><td className="p-3">{currency} {money(row.expectedAmount)}</td><td className="p-3">{currency} {money(row.billedAmount)}</td><td className={`p-3 font-bold ${row.variance > 0 ? "text-destructive" : "text-primary"}`}>{currency} {money(row.variance)}</td></tr>)}</tbody></table></section>
    <div className="rounded-xl bg-primary p-5 text-primary-foreground"><p className="text-sm opacity-75">Tariff-versus-invoice result</p><p className="mt-1 text-3xl font-bold">{currency} {money(audit.variance)} questioned</p><p className="mt-2 text-xs opacity-80">Expected {currency} {money(audit.expectedTotal)} Â· Billed {currency} {money(audit.billedTotal)} Â· {containers.length} container{containers.length === 1 ? "" : "s"} Â· demurrage, detention and terminal storage separated.</p></div>
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv}><Download/> Export calculation evidence</Button><Button onClick={printReport}><Printer/> Print dispute-ready report</Button></div>
    <p className="text-xs leading-5 text-muted-foreground">Country dates can be loaded from the Nager.Date public-holiday API. Verify them against the governing port/terminal calendar and add terminal-only closures manually. Offset-bearing event timestamps are converted to the entered IANA timezone before tariff-day counting. This audit does not decide tariff applicability, force majeure, customs holds, exceptions or legal liability.</p>
  </div>;
}

function SmallInput({ label, value, set, type = "number", placeholder }: { label: string; value: string | number; set: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-xs">{label}<input className={`${field} mt-1 min-h-10`} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)}/></label>;
}
function download(name: string, text: string, type: string) { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function escape(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char)); }
