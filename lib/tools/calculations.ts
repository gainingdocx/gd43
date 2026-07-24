export type DimensionUnit = "mm" | "cm" | "m" | "in";
export type WeightUnit = "kg" | "lb";

const METRES_PER_UNIT: Record<DimensionUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
};

const LB_PER_KG = 2.2046226218487757;

export function volumeM3(
  length: number,
  width: number,
  height: number,
  quantity = 1,
  unit: DimensionUnit = "cm"
) {
  const factor = METRES_PER_UNIT[unit];
  return Math.max(0, length) * Math.max(0, width) * Math.max(0, height)
    * Math.max(0, quantity) * factor ** 3;
}

export function volumetricWeight(
  length: number,
  width: number,
  height: number,
  quantity: number,
  unit: DimensionUnit,
  divisor: number,
  outputUnit: WeightUnit,
  divisorBasis: "cm3_per_kg" | "in3_per_lb" = "cm3_per_kg"
) {
  if (divisor <= 0) return 0;
  if (divisorBasis === "in3_per_lb") {
    const cubicInches = volumeM3(length, width, height, quantity, unit) / 0.000016387064;
    const pounds = cubicInches / divisor;
    return outputUnit === "lb" ? pounds : pounds / LB_PER_KG;
  }
  const kg = volumeM3(length, width, height, quantity, unit) * 1_000_000 / divisor;
  return outputUnit === "lb" ? kg * LB_PER_KG : kg;
}

export function chargeableWeight(actual: number, volumetric: number) {
  return Math.max(0, actual, volumetric);
}

export interface LclWmInput {
  cbm: number;
  grossKg: number;
  ratePerRevenueTon: number;
  minimumRevenueTons?: number;
  originCharges?: number;
  destinationCharges?: number;
  otherCharges?: number;
}

export function calculateLclWm(input: LclWmInput) {
  const volumeRevenueTons = Math.max(0, input.cbm);
  const weightRevenueTons = Math.max(0, input.grossKg) / 1_000;
  const minimumRevenueTons = Math.max(0, input.minimumRevenueTons ?? 1);
  const chargeableRevenueTons = Math.max(
    volumeRevenueTons,
    weightRevenueTons,
    minimumRevenueTons
  );
  const baseFreight = chargeableRevenueTons * Math.max(0, input.ratePerRevenueTon);
  const accessorials = Math.max(0, input.originCharges ?? 0)
    + Math.max(0, input.destinationCharges ?? 0)
    + Math.max(0, input.otherCharges ?? 0);
  return {
    volumeRevenueTons,
    weightRevenueTons,
    chargeableRevenueTons,
    basis: minimumRevenueTons > Math.max(volumeRevenueTons, weightRevenueTons)
      ? "minimum" as const
      : volumeRevenueTons >= weightRevenueTons
        ? "measurement" as const
        : "weight" as const,
    baseFreight,
    accessorials,
    total: baseFreight + accessorials,
  };
}

export interface FreeTimeChargeInput {
  startDate: string;
  endDate: string;
  freeDays: number;
  firstTierDays: number;
  firstTierDailyRate: number;
  secondTierDailyRate: number;
  fixedCharges?: number;
}

function utcDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function calculateFreeTimeCharge(input: FreeTimeChargeInput) {
  const start = utcDay(input.startDate);
  const end = utcDay(input.endDate);
  const elapsedDays = start === null || end === null ? 0 : Math.max(0, Math.round((end - start) / 86_400_000));
  const freeDays = Math.max(0, Math.floor(input.freeDays));
  const chargeableDays = Math.max(0, elapsedDays - freeDays);
  const firstTierDays = Math.min(chargeableDays, Math.max(0, Math.floor(input.firstTierDays)));
  const secondTierDays = Math.max(0, chargeableDays - firstTierDays);
  const firstTierCharge = firstTierDays * Math.max(0, input.firstTierDailyRate);
  const secondTierCharge = secondTierDays * Math.max(0, input.secondTierDailyRate);
  const fixedCharges = Math.max(0, input.fixedCharges ?? 0);
  return {
    elapsedDays,
    freeDays,
    chargeableDays,
    firstTierDays,
    secondTierDays,
    firstTierCharge,
    secondTierCharge,
    fixedCharges,
    total: firstTierCharge + secondTierCharge + fixedCharges,
  };
}

export type RotationRule = "all" | "upright" | "fixed";

export interface ContainerSpec {
  name: string;
  internal: [number, number, number];
  door: [number, number];
  nominalCbm: number;
  payloadKg: number;
}

export const CONTAINER_SPECS: Record<string, ContainerSpec> = {
  "20gp": { name: "20′ general purpose", internal: [5.90, 2.35, 2.39], door: [2.34, 2.28], nominalCbm: 33.1, payloadKg: 28_200 },
  "40gp": { name: "40′ general purpose", internal: [12.03, 2.35, 2.39], door: [2.34, 2.28], nominalCbm: 67.7, payloadKg: 26_700 },
  "40hc": { name: "40′ high cube", internal: [12.03, 2.35, 2.69], door: [2.34, 2.58], nominalCbm: 76.3, payloadKg: 26_460 },
  "45hc": { name: "45′ high cube", internal: [13.55, 2.35, 2.69], door: [2.34, 2.58], nominalCbm: 85.7, payloadKg: 27_700 },
};

function uniqueOrientations(dims: [number, number, number], rotation: RotationRule) {
  const [a, b, c] = dims;
  const rows: [number, number, number][] = rotation === "fixed"
    ? [[a, b, c]]
    : rotation === "upright"
      ? [[a, b, c], [b, a, c]]
      : [[a,b,c], [a,c,b], [b,a,c], [b,c,a], [c,a,b], [c,b,a]];
  return rows.filter((row, index, all) =>
    all.findIndex((other) => other.join("|") === row.join("|")) === index
  );
}

export function calculateContainerFit(input: {
  spec: ContainerSpec;
  cartonDimensions: [number, number, number];
  unit: DimensionUnit;
  quantity: number;
  pieceKg?: number;
  rotation: RotationRule;
}) {
  const factor = METRES_PER_UNIT[input.unit];
  const dims = input.cartonDimensions.map((value) => Math.max(0, value) * factor) as [number, number, number];
  const [containerLength, containerWidth, containerHeight] = input.spec.internal;
  const [doorWidth, doorHeight] = input.spec.door;
  const orientations = uniqueOrientations(dims, input.rotation).map(([length, width, height]) => {
    const doorFits = width <= doorWidth && height <= doorHeight;
    const count = length && width && height && doorFits
      ? Math.floor(containerLength / length) * Math.floor(containerWidth / width) * Math.floor(containerHeight / height)
      : 0;
    return { length, width, height, doorFits, count };
  }).sort((a, b) => b.count - a.count);
  const best = orientations[0] ?? { length: 0, width: 0, height: 0, doorFits: false, count: 0 };
  const pieceKg = Math.max(0, input.pieceKg ?? 0);
  const maxByWeight = pieceKg ? Math.floor(input.spec.payloadKg / pieceKg) : Number.POSITIVE_INFINITY;
  const maxUnits = Math.min(best.count, maxByWeight);
  const quantity = Math.max(0, input.quantity);
  return {
    best,
    maxByWeight,
    maxUnits,
    containersNeeded: maxUnits > 0 ? Math.ceil(quantity / maxUnits) : 0,
    cargoCbm: volumeM3(...input.cartonDimensions, quantity, input.unit),
    cargoKg: pieceKg * quantity,
    fitsOne: quantity > 0 && maxUnits > 0 && quantity <= maxUnits,
  };
}
