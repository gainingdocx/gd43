// POST /v1/tools/volume — CBM and chargeable weight for one or more package
// groups. Wraps the same calculation module the on-site calculator uses, so an
// API answer and a browser answer can never drift apart.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import {
  optionalNumber,
  requireArray,
  requireEnum,
  requireNumber,
} from "@/lib/api/validate";
import {
  chargeableWeight,
  volumeM3,
  volumetricWeight,
  type DimensionUnit,
  type WeightUnit,
} from "@/lib/tools/calculations";

const UNITS = ["mm", "cm", "m", "in"] as const;
const WEIGHT_UNITS = ["kg", "lb"] as const;

interface GroupInput {
  length?: unknown;
  width?: unknown;
  height?: unknown;
  quantity?: unknown;
  gross_weight?: unknown;
}

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  const body = await readJson<{
    groups?: unknown;
    unit?: unknown;
    weight_unit?: unknown;
    divisor?: unknown;
    divisor_basis?: unknown;
  }>(request);

  const groups = requireArray<GroupInput>(body.groups, "groups", { min: 1, max: 200 });
  const unit = requireEnum<DimensionUnit>(body.unit, "unit", UNITS, "cm");
  const weightUnit = requireEnum<WeightUnit>(body.weight_unit, "weight_unit", WEIGHT_UNITS, "kg");
  const divisorBasis = requireEnum(
    body.divisor_basis,
    "divisor_basis",
    ["cm3_per_kg", "in3_per_lb"] as const,
    "cm3_per_kg"
  );
  // 6000 cm³/kg is the general air-cargo divisor; express is 5000. Defaulting to
  // the more conservative general figure avoids silently under-rating.
  const divisor = optionalNumber(body.divisor, "divisor", divisorBasis === "in3_per_lb" ? 139 : 6000, {
    min: 1,
  });

  let totalVolume = 0;
  let totalActual = 0;
  let totalVolumetric = 0;

  const lines = groups.map((group, index) => {
    const prefix = `groups[${index}]`;
    const length = requireNumber(group.length, `${prefix}.length`, { min: 0 });
    const width = requireNumber(group.width, `${prefix}.width`, { min: 0 });
    const height = requireNumber(group.height, `${prefix}.height`, { min: 0 });
    const quantity = optionalNumber(group.quantity, `${prefix}.quantity`, 1, { min: 0 });
    const grossWeight = optionalNumber(group.gross_weight, `${prefix}.gross_weight`, 0, { min: 0 });

    const cbm = volumeM3(length, width, height, quantity, unit);
    const volumetric = volumetricWeight(
      length, width, height, quantity, unit, divisor, weightUnit, divisorBasis
    );

    totalVolume += cbm;
    totalActual += grossWeight;
    totalVolumetric += volumetric;

    return {
      length, width, height, quantity,
      volume_m3: round(cbm, 6),
      volumetric_weight: round(volumetric, 3),
      gross_weight: grossWeight,
    };
  });

  const chargeable = chargeableWeight(totalActual, totalVolumetric);

  return json(
    {
      object: "volume_calculation",
      unit,
      weight_unit: weightUnit,
      divisor,
      divisor_basis: divisorBasis,
      lines,
      totals: {
        volume_m3: round(totalVolume, 6),
        actual_weight: round(totalActual, 3),
        volumetric_weight: round(totalVolumetric, 3),
        chargeable_weight: round(chargeable, 3),
        // Which figure the carrier will rate on. The whole point of the call.
        rated_on: chargeable > totalActual ? "volumetric" : "actual",
      },
    },
    { id, headers: rateHeaders(caller) }
  );
});

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
