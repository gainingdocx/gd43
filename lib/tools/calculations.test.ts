import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateContainerFit,
  calculateFreeTimeCharge,
  calculateLclWm,
  chargeableWeight,
  CONTAINER_SPECS,
  volumeM3,
  volumetricWeight,
} from "./calculations";

describe("shipping calculations", () => {
  it("calculates the supplied real Maersk B/L measurement and LCL W/M basis", () => {
    const result = calculateLclWm({
      cbm: 20,
      grossKg: 15_750,
      ratePerRevenueTon: 75,
      originCharges: 125,
      destinationCharges: 225,
    });
    assert.equal(result.weightRevenueTons, 15.75);
    assert.equal(result.chargeableRevenueTons, 20);
    assert.equal(result.basis, "measurement");
    assert.equal(result.baseFreight, 1_500);
    assert.equal(result.total, 1_850);
  });

  it("identifies a carrier minimum as the controlling LCL basis", () => {
    const result = calculateLclWm({
      cbm: 0.4,
      grossKg: 250,
      ratePerRevenueTon: 80,
      minimumRevenueTons: 1,
    });
    assert.equal(result.basis, "minimum");
    assert.equal(result.chargeableRevenueTons, 1);
    assert.equal(result.total, 80);
  });

  it("audits tiered demurrage after contractual free time", () => {
    const result = calculateFreeTimeCharge({
      startDate: "2026-07-01",
      endDate: "2026-07-13",
      freeDays: 5,
      firstTierDays: 3,
      firstTierDailyRate: 75,
      secondTierDailyRate: 125,
      fixedCharges: 40,
    });
    assert.deepEqual(result, {
      elapsedDays: 12,
      freeDays: 5,
      chargeableDays: 7,
      firstTierDays: 3,
      secondTierDays: 4,
      firstTierCharge: 225,
      secondTierCharge: 500,
      fixedCharges: 40,
      total: 765,
    });
  });

  it("supports inclusive calendar-day detention tariffs", () => {
    const result = calculateFreeTimeCharge({
      startDate: "2026-07-01",
      endDate: "2026-07-13",
      freeDays: 5,
      firstTierDays: 3,
      firstTierDailyRate: 75,
      secondTierDailyRate: 125,
      includeStartDate: true,
    });
    assert.equal(result.elapsedDays, 13);
    assert.equal(result.chargeableDays, 8);
    assert.equal(result.total, 850);
  });

  it("can exclude weekends when a tariff uses working days", () => {
    const result = calculateFreeTimeCharge({
      startDate: "2026-07-03",
      endDate: "2026-07-13",
      freeDays: 2,
      firstTierDays: 3,
      firstTierDailyRate: 50,
      secondTierDailyRate: 100,
      dayBasis: "weekdays",
    });
    assert.equal(result.elapsedDays, 6);
    assert.equal(result.chargeableDays, 4);
    assert.equal(result.total, 250);
  });

  it("converts inches correctly for general air cargo instead of applying 6000 to cubic inches", () => {
    const pounds = volumetricWeight(20, 20, 20, 1, "in", 6_000, "lb");
    assert.ok(Math.abs(pounds - 48.2) < 0.1);
    assert.equal(chargeableWeight(40, pounds), pounds);
  });

  it("supports the contractual 139 cubic-inch-per-pound express divisor exactly", () => {
    assert.ok(Math.abs(volumetricWeight(20, 20, 20, 1, "in", 139, "lb", "in3_per_lb") - 57.554) < 0.001);
  });

  it("produces the same physical volume in centimetres and inches", () => {
    assert.ok(Math.abs(volumeM3(100, 100, 100, 1, "cm") - 1) < 1e-12);
    assert.ok(Math.abs(volumeM3(39.37007874, 39.37007874, 39.37007874, 1, "in") - 1) < 1e-9);
  });

  it("rejects a carton that fits internal dimensions but cannot pass the door", () => {
    const result = calculateContainerFit({
      spec: CONTAINER_SPECS["20gp"],
      cartonDimensions: [100, 234.5, 229],
      unit: "cm",
      quantity: 1,
      rotation: "fixed",
    });
    assert.equal(result.best.doorFits, false);
    assert.equal(result.maxUnits, 0);
  });

  it("keeps upright cargo vertical while allowing floor rotation", () => {
    const result = calculateContainerFit({
      spec: CONTAINER_SPECS["40hc"],
      cartonDimensions: [120, 80, 100],
      unit: "cm",
      quantity: 100,
      pieceKg: 50,
      rotation: "upright",
    });
    assert.equal(result.best.height, 1);
    assert.ok(result.maxUnits > 0);
  });
});
