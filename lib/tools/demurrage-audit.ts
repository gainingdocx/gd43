export type ChargePhase = "demurrage" | "detention" | "storage";

export interface RateTier {
  /** Number of days in this tier; null means all remaining days. */
  days: number | null;
  dailyRate: number;
}

export interface PhaseTariff {
  freeDays: number;
  tiers: RateTier[];
  fixedCharges: number;
}

export interface PhaseEvents {
  start: string;
  end: string;
  billedAmount?: number;
}

export interface FreeTimeContainer {
  containerNo: string;
  demurrage: PhaseEvents;
  detention: PhaseEvents;
  storage: PhaseEvents;
}

export interface FreeTimeAuditInput {
  containers: FreeTimeContainer[];
  tariffs: Record<ChargePhase, PhaseTariff>;
  dayBasis: "calendar" | "working";
  includeStartDate: boolean;
  holidays: string[];
  currency: string;
  timezone: string;
}

const DAY = 86_400_000;

function localDateText(value: string, timezone?: string) {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) && timezone && timezone !== "Local terminal time") {
    const instant = new Date(value);
    if (!Number.isNaN(instant.valueOf())) {
      try {
        const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
        const get = (type: string) => parts.find((part) => part.type === type)?.value;
        const formatted = `${get("year")}-${get("month")}-${get("day")}`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
      } catch { /* Invalid IANA zone: preserve the printed local date below. */ }
    }
  }
  return value.slice(0, 10);
}

function dayValue(value: string, timezone?: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDateText(value, timezone));
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isoDay(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function eligible(day: number, basis: FreeTimeAuditInput["dayBasis"], holidays: Set<string>) {
  if (holidays.has(isoDay(day))) return false;
  if (basis === "calendar") return true;
  const weekday = new Date(day).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

export function calculatePhase(
  events: PhaseEvents,
  tariff: PhaseTariff,
  options: Pick<FreeTimeAuditInput, "dayBasis" | "includeStartDate" | "holidays"> & { timezone?: string }
) {
  const start = dayValue(events.start, options.timezone);
  const end = dayValue(events.end, options.timezone);
  const holidays = new Set(options.holidays.filter((item) => dayValue(item, options.timezone) !== null).map((item) => localDateText(item, options.timezone)));
  const counted: number[] = [];
  if (start !== null && end !== null && end >= start) {
    const first = options.includeStartDate ? start : start + DAY;
    for (let day = first; day <= end; day += DAY) if (eligible(day, options.dayBasis, holidays)) counted.push(day);
  }
  const freeDays = Math.max(0, Math.floor(tariff.freeDays));
  const chargeableDays = Math.max(0, counted.length - freeDays);
  let remaining = chargeableDays;
  const tierBreakdown = tariff.tiers.map((tier, index) => {
    const days = tier.days === null ? remaining : Math.min(remaining, Math.max(0, Math.floor(tier.days)));
    remaining -= days;
    return { tier: index + 1, days, dailyRate: Math.max(0, tier.dailyRate), amount: days * Math.max(0, tier.dailyRate) };
  });
  if (remaining > 0) {
    const lastRate = Math.max(0, tariff.tiers.at(-1)?.dailyRate ?? 0);
    tierBreakdown.push({ tier: tierBreakdown.length + 1, days: remaining, dailyRate: lastRate, amount: remaining * lastRate });
  }
  const variableAmount = tierBreakdown.reduce((sum, tier) => sum + tier.amount, 0);
  const fixedCharges = Math.max(0, tariff.fixedCharges);
  const expectedAmount = variableAmount + fixedCharges;
  const billedAmount = Math.max(0, events.billedAmount ?? 0);
  return {
    elapsedDays: counted.length,
    freeDays,
    chargeableDays,
    lastFreeDay: freeDays > 0 && counted.length ? isoDay(counted[Math.min(freeDays, counted.length) - 1]) : null,
    tierBreakdown,
    fixedCharges,
    expectedAmount,
    billedAmount,
    variance: billedAmount ? billedAmount - expectedAmount : 0,
  };
}

export function auditFreeTime(input: FreeTimeAuditInput) {
  const rows = input.containers.flatMap((container) => (["demurrage", "detention", "storage"] as ChargePhase[]).map((phase) => ({
    containerNo: container.containerNo.trim().toUpperCase(),
    phase,
    start: container[phase].start,
    end: container[phase].end,
    ...calculatePhase(container[phase], input.tariffs[phase], input),
  })));
  return {
    rows,
    expectedTotal: rows.reduce((sum, row) => sum + row.expectedAmount, 0),
    billedTotal: rows.reduce((sum, row) => sum + row.billedAmount, 0),
    variance: rows.reduce((sum, row) => sum + row.variance, 0),
    generatedAt: new Date().toISOString(),
  };
}
