// POST /v1/tools/freight-charges — the two charge calculations forwarders audit
// most: LCL weight-or-measure freight, and demurrage/detention against free
// time. Both return the working, not just a total, because the caller is
// usually disputing a carrier invoice and needs to show which figure controlled.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { badRequest, } from "@/lib/api/errors";
import { optionalNumber, requireEnum, requireNumber, requireString } from "@/lib/api/validate";
import { calculateFreeTimeCharge, calculateLclWm } from "@/lib/tools/calculations";

const CALCULATIONS = ["lcl_wm", "free_time"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  const body = await readJson<Record<string, unknown>>(request);
  const calculation = requireEnum(body.calculation, "calculation", CALCULATIONS);

  const result = calculation === "lcl_wm" ? lclWm(body) : freeTime(body);
  return json({ object: "freight_charge_calculation", calculation, ...result }, {
    id,
    headers: rateHeaders(caller),
  });
});

function lclWm(body: Record<string, unknown>) {
  const output = calculateLclWm({
    cbm: requireNumber(body.cbm, "cbm", { min: 0 }),
    grossKg: requireNumber(body.gross_kg, "gross_kg", { min: 0 }),
    ratePerRevenueTon: requireNumber(body.rate_per_revenue_ton, "rate_per_revenue_ton", { min: 0 }),
    minimumRevenueTons: optionalNumber(body.minimum_revenue_tons, "minimum_revenue_tons", 1, { min: 0 }),
    originCharges: optionalNumber(body.origin_charges, "origin_charges", 0, { min: 0 }),
    destinationCharges: optionalNumber(body.destination_charges, "destination_charges", 0, { min: 0 }),
    otherCharges: optionalNumber(body.other_charges, "other_charges", 0, { min: 0 }),
  });

  return {
    volume_revenue_tons: round(output.volumeRevenueTons),
    weight_revenue_tons: round(output.weightRevenueTons),
    chargeable_revenue_tons: round(output.chargeableRevenueTons),
    // Which of measurement, weight or the contractual minimum decided the bill.
    basis: output.basis,
    base_freight: round(output.baseFreight),
    accessorials: round(output.accessorials),
    total: round(output.total),
  };
}

function freeTime(body: Record<string, unknown>) {
  const startDate = requireString(body.start_date, "start_date");
  const endDate = requireString(body.end_date, "end_date");
  if (!ISO_DATE.test(startDate)) throw badRequest("`start_date` must be an ISO date (YYYY-MM-DD).", "start_date");
  if (!ISO_DATE.test(endDate)) throw badRequest("`end_date` must be an ISO date (YYYY-MM-DD).", "end_date");
  if (endDate < startDate) throw badRequest("`end_date` cannot fall before `start_date`.", "end_date");

  const output = calculateFreeTimeCharge({
    startDate,
    endDate,
    freeDays: requireNumber(body.free_days, "free_days", { min: 0 }),
    firstTierDays: optionalNumber(body.first_tier_days, "first_tier_days", 0, { min: 0 }),
    firstTierDailyRate: optionalNumber(body.first_tier_daily_rate, "first_tier_daily_rate", 0, { min: 0 }),
    secondTierDailyRate: optionalNumber(body.second_tier_daily_rate, "second_tier_daily_rate", 0, { min: 0 }),
    fixedCharges: optionalNumber(body.fixed_charges, "fixed_charges", 0, { min: 0 }),
    dayBasis: requireEnum(body.day_basis, "day_basis", ["calendar", "weekdays"] as const, "calendar"),
    includeStartDate: body.include_start_date === true,
  });

  return {
    elapsed_days: output.elapsedDays,
    free_days: output.freeDays,
    chargeable_days: output.chargeableDays,
    first_tier_days: output.firstTierDays,
    second_tier_days: output.secondTierDays,
    first_tier_charge: round(output.firstTierCharge),
    second_tier_charge: round(output.secondTierCharge),
    fixed_charges: round(output.fixedCharges),
    total: round(output.total),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
