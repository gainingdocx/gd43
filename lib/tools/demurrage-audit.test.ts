import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { auditFreeTime, calculatePhase } from "./demurrage-audit";

describe("free-time audit", () => {
  it("applies unlimited tiers after free time", () => {
    const result = calculatePhase(
      { start: "2026-08-01T09:00", end: "2026-08-12T17:00", billedAmount: 900 },
      { freeDays: 3, fixedCharges: 25, tiers: [{ days: 4, dailyRate: 50 }, { days: null, dailyRate: 100 }] },
      { dayBasis: "calendar", includeStartDate: false, holidays: [] }
    );
    assert.equal(result.elapsedDays, 11);
    assert.equal(result.chargeableDays, 8);
    assert.equal(result.lastFreeDay, "2026-08-04");
    assert.deepEqual(result.tierBreakdown.map((tier) => tier.amount), [200, 400]);
    assert.equal(result.expectedAmount, 625);
    assert.equal(result.variance, 275);
  });

  it("excludes weekends and verified holidays on working-day tariffs", () => {
    const result = calculatePhase(
      { start: "2026-08-03", end: "2026-08-10" },
      { freeDays: 2, fixedCharges: 0, tiers: [{ days: null, dailyRate: 75 }] },
      { dayBasis: "working", includeStartDate: false, holidays: ["2026-08-05"] }
    );
    assert.equal(result.elapsedDays, 4);
    assert.equal(result.lastFreeDay, "2026-08-06");
    assert.equal(result.chargeableDays, 2);
    assert.equal(result.expectedAmount, 150);
  });

  it("separates demurrage, detention and terminal storage for every container", () => {
    const blank = { freeDays: 0, fixedCharges: 0, tiers: [{ days: null, dailyRate: 10 }] };
    const audit = auditFreeTime({
      currency: "USD", timezone: "UTC+08:00", dayBasis: "calendar", includeStartDate: false, holidays: [],
      tariffs: { demurrage: blank, detention: blank, storage: blank },
      containers: [
        { containerNo: "mscu6639870", demurrage: { start: "2026-08-01", end: "2026-08-02" }, detention: { start: "2026-08-02", end: "2026-08-04" }, storage: { start: "2026-08-01", end: "2026-08-03" } },
        { containerNo: "CSQU3054383", demurrage: { start: "", end: "" }, detention: { start: "", end: "" }, storage: { start: "", end: "" } },
      ],
    });
    assert.equal(audit.rows.length, 6);
    assert.equal(audit.expectedTotal, 50);
    assert.equal(audit.rows[0].containerNo, "MSCU6639870");
  });

  it("converts offset timestamps into the selected terminal timezone", () => {
    const result = calculatePhase(
      { start: "2026-08-01T23:30:00Z", end: "2026-08-03T00:30:00Z" },
      { freeDays: 0, fixedCharges: 0, tiers: [{ days: null, dailyRate: 10 }] },
      { dayBasis: "calendar", includeStartDate: false, holidays: [], timezone: "Asia/Singapore" }
    );
    assert.equal(result.elapsedDays, 1);
  });
});
