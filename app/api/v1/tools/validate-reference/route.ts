// POST /v1/tools/validate-reference — batch check the reference numbers that
// carry check digits: ISO 6346 container numbers and IATA modulus-7 air waybill
// numbers, plus UN/LOCODE port resolution.
//
// One endpoint rather than three because callers validating a shipment almost
// always have a mixed bag of references and would otherwise fan out three
// requests against their rate limit.

import { authenticate, rateHeaders } from "@/lib/api/auth";
import { handler, json, preflight, readJson } from "@/lib/api/respond";
import { requireArray, requireEnum, requireString } from "@/lib/api/validate";
import { computeCheckDigit, normalizeContainerNo } from "@/lib/validators/container";
import { awbCheckDigit, normalizeAwbNumber } from "@/lib/validators/air-waybill";
import { looksLikeUnlocode, portNameForCode, resolvePortCode, unlocode } from "@/lib/validators/unlocode";

const TYPES = ["container", "awb", "port"] as const;
type RefType = (typeof TYPES)[number];

export const OPTIONS = preflight;

export const POST = handler(async (request, id) => {
  const caller = await authenticate(request);
  const body = await readJson<{ type?: unknown; values?: unknown }>(request);

  const type = requireEnum<RefType>(body.type, "type", TYPES);
  const values = requireArray<unknown>(body.values, "values", { min: 1, max: 200 });

  const results = values.map((raw, index) => {
    const value = requireString(raw, `values[${index}]`, { max: 120 });
    if (type === "container") return checkContainer(value);
    if (type === "awb") return checkAwb(value);
    return checkPort(value);
  });

  return json(
    {
      object: "reference_validation",
      type,
      checked: results.length,
      valid_count: results.filter((r) => r.valid).length,
      results,
    },
    { id, headers: rateHeaders(caller) }
  );
});

function checkContainer(value: string) {
  const normalized = normalizeContainerNo(value);
  const expected = computeCheckDigit(normalized);

  if (!/^[A-Z]{4}\d{7}$/.test(normalized)) {
    return {
      input: value,
      normalized,
      valid: false,
      reason: "Container numbers are four letters followed by seven digits (ISO 6346).",
      expected_check_digit: null,
    };
  }
  const actual = Number(normalized[10]);
  const valid = expected !== null && expected === actual;
  return {
    input: value,
    normalized,
    valid,
    // An expected digit is far more useful than a boolean: it tells the caller
    // whether they have a typo or a fabricated number.
    expected_check_digit: expected,
    ...(valid
      ? {}
      : { reason: `Check digit is ${actual}; ISO 6346 requires ${expected}.`, suggested: `${normalized.slice(0, 10)}${expected}` }),
  };
}

function checkAwb(value: string) {
  const normalized = normalizeAwbNumber(value);
  const expected = awbCheckDigit(normalized);
  if (!/^\d{11}$/.test(normalized)) {
    return {
      input: value,
      normalized,
      valid: false,
      reason: "A master air waybill number is 11 digits: a 3-digit airline prefix, 7-digit serial and check digit.",
      expected_check_digit: null,
    };
  }
  const actual = Number(normalized[10]);
  const valid = expected !== null && expected === actual;
  return {
    input: value,
    normalized,
    airline_prefix: normalized.slice(0, 3),
    serial: normalized.slice(3, 10),
    valid,
    expected_check_digit: expected,
    ...(valid ? {} : { reason: `Check digit is ${actual}; modulus 7 requires ${expected}.`, suggested: `${normalized.slice(0, 10)}${expected}` }),
  };
}

function checkPort(value: string) {
  const upper = value.toUpperCase().replace(/\s+/g, "");
  if (looksLikeUnlocode(upper)) {
    const resolved = resolvePortCode(upper);
    return {
      input: value,
      valid: Boolean(resolved),
      code: resolved?.code ?? upper,
      name: resolved?.name ?? portNameForCode(upper),
      // Set when the document printed a superseded code, so the caller can fix
      // their master data rather than just pass the check.
      legacy_code: resolved?.legacy ?? null,
      ...(resolved ? {} : { reason: "Not found in the bundled UN/LOCODE dataset." }),
    };
  }
  const match = unlocode(value);
  return {
    input: value,
    valid: Boolean(match),
    code: match?.code ?? null,
    name: match?.name ?? null,
    // 1 = exact name match; lower means fuzzy, which the caller may want to
    // confirm before writing it to a booking.
    match_score: match?.score ?? null,
    ...(match ? {} : { reason: "No UN/LOCODE match for that port name." }),
  };
}
