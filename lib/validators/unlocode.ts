// UN/LOCODE port lookup (BUILD_SPEC §M5.3). Fuzzy match against
// data/unlocode.json — UNECE UN/LOCODE 2024-2 filtered to maritime ports
// (Function position 1 = '1'); provenance in scripts/build-unlocode.mjs.
//
// IMPORTANT verdict semantics: a code that is missing from the dataset is a
// WARN, never a fail. The dataset is trimmed to port-function entries and
// UNECE has reassigned some famous codes (CNSHA is now Hongqiao Airport;
// the Port of Shanghai is CNSGH) while real-world B/Ls still print the old
// codes. Only a name↔code contradiction we can prove is a fail.

import dataset from "@/data/unlocode.json";
import type { PortRef } from "@/lib/ai/schemas/shared";
import { levenshtein, normalizeText } from "./normalize";
import type { ValidationResult } from "./types";

export interface PortMatch {
  code: string;
  name: string;
  /** 1 = exact normalized name match. */
  score: number;
}

const PORTS = dataset.ports as [string, string][];

// Lazy indexes (module-level; built on first lookup).
let byCode: Map<string, string> | null = null;
let byName: Map<string, string[]> | null = null;

function buildIndexes() {
  byCode = new Map();
  byName = new Map();
  for (const [code, name] of PORTS) {
    byCode.set(code, name);
    for (const key of nameKeys(name)) {
      const list = byName.get(key);
      if (list) list.push(code);
      else byName.set(key, [code]);
    }
  }
}

/** Strip generic port words documents (and the dataset) add around names. */
function stripGeneric(normalized: string): string {
  const s = normalized
    .replace(/^PORT OF /, "")
    .replace(/ (SEAPORT|PORT|PT|HARBOUR|HARBOR|TERMINAL)$/, "")
    .trim();
  return s === "" ? normalized : s;
}

/** Index keys for a dataset name: full + stripped + parenthesized alternates. */
function nameKeys(name: string): string[] {
  const keys = new Set<string>();
  const parts = [name];
  // "Jawaharlal Nehru (Nhava Sheva)" -> both parts match on their own
  const m = name.match(/^([^(]+)\(([^)]+)\)/);
  if (m) parts.push(m[1], m[2]);
  for (const part of parts) {
    const full = normalizeText(part);
    if (!full) continue;
    keys.add(full);
    keys.add(stripGeneric(full));
  }
  return [...keys];
}

/** Normalized query with generic port words removed. */
function queryKey(portName: string): string {
  return stripGeneric(normalizeText(portName));
}

/**
 * Documents print ports as "HELSINKI, FINLAND" or "NHAVA SHEVA (JNPT),
 * INDIA" — try the full string first, then progressively without the
 * country suffix and parenthesized qualifiers.
 */
function queryCandidates(portName: string): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    const k = queryKey(s);
    if (k && !out.includes(k)) out.push(k);
  };
  push(portName);
  const beforeComma = portName.split(",")[0];
  push(beforeComma);
  push(beforeComma.replace(/\([^)]*\)/g, " "));
  const paren = portName.match(/\(([^)]+)\)/);
  if (paren) push(paren[1]);
  return out;
}

/** True when the string looks like a UN/LOCODE ("SGSIN" or "SG SIN"). */
export function looksLikeUnlocode(s: string): boolean {
  return /^[A-Z]{2}\s?[A-Z0-9]{3}$/i.test(s.trim());
}

/** Exact code lookup: dataset name or null. */
export function portNameForCode(code: string): string | null {
  if (!byCode) buildIndexes();
  return byCode!.get(code.toUpperCase().replace(/\s+/g, "")) ?? null;
}

/**
 * Spec entry point: fuzzy port-name lookup. Returns the best match or null
 * when nothing scores ≥ minScore (default 0.75).
 */
export function unlocode(portName: string, minScore = 0.75): PortMatch | null {
  if (!byCode) buildIndexes();

  const raw = portName.trim();
  if (raw === "") return null;

  // Direct code input.
  if (looksLikeUnlocode(raw)) {
    const code = raw.toUpperCase().replace(/\s+/g, "");
    const name = byCode!.get(code);
    if (name) return { code, name, score: 1 };
  }

  const candidates = queryCandidates(raw);
  if (candidates.length === 0) return null;

  // Exact normalized name, most-specific candidate first.
  for (const q of candidates) {
    const exact = byName!.get(q);
    if (exact && exact.length > 0) {
      return { code: exact[0], name: byCode!.get(exact[0])!, score: 1 };
    }
  }

  // Fuzzy scan. Cheap prefilters keep this fast enough for 17.5k entries.
  let best: PortMatch | null = null;
  for (const q of candidates) {
    for (const [code, name] of PORTS) {
      for (const key of nameKeys(name)) {
        if (Math.abs(key.length - q.length) > Math.ceil(q.length * 0.4)) continue;
        const dist = levenshtein(q, key);
        const score = 1 - dist / Math.max(q.length, key.length);
        if (score > (best?.score ?? 0)) best = { code, name, score };
      }
    }
  }
  return best && best.score >= minScore ? best : null;
}

/** ValidationResult(s) for a PortRef field used by validateDocument. */
export function validatePort(
  field: string,
  port: PortRef | null
): ValidationResult[] {
  if (!port || (port.name === null && port.unlocode === null)) return [];
  const results: ValidationResult[] = [];

  if (port.unlocode) {
    const code = port.unlocode.toUpperCase().replace(/\s+/g, "");
    const datasetName = portNameForCode(code);
    if (!datasetName) {
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "warn",
        message: `${code} is not in our UN/LOCODE seaport list (2024-2) — it may be an airport/city code or a legacy code still in commercial use`,
        actual: code,
      });
    } else if (port.name && unlocodeNameAgrees(port.name, datasetName)) {
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "pass",
        message: `${code} = ${datasetName} (UN/LOCODE 2024-2)`,
        actual: code,
      });
    } else if (port.name) {
      const suggested = unlocode(port.name);
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "fail",
        message: `${code} is "${datasetName}" in UN/LOCODE, but the document says "${port.name}"${suggested ? ` (did you mean ${suggested.code}?)` : ""}`,
        expected: suggested?.code,
        actual: code,
      });
    } else {
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "pass",
        message: `${code} = ${datasetName} (UN/LOCODE 2024-2)`,
        actual: code,
      });
    }
    return results;
  }

  // Name only: suggest a code.
  const match = unlocode(port.name!);
  results.push(
    match
      ? {
          field: `${field}.name`,
          rule: "unlocode",
          status: "pass",
          message: `Matched "${port.name}" to ${match.code} (${match.name})`,
          expected: match.code,
          actual: port.name!,
        }
      : {
          field: `${field}.name`,
          rule: "unlocode",
          status: "warn",
          message: `Could not match "${port.name}" to a UN/LOCODE seaport`,
          actual: port.name!,
        }
  );
  return results;
}

/** Port-name agreement is looser than party names: substring or ≥0.75. */
function unlocodeNameAgrees(docName: string, datasetName: string): boolean {
  const a = queryKey(docName);
  for (const key of nameKeys(datasetName)) {
    if (a === key || key.includes(a) || a.includes(key)) return true;
    const dist = levenshtein(a, key);
    if (1 - dist / Math.max(a.length, key.length) >= 0.75) return true;
  }
  return false;
}
