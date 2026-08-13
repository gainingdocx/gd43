// UN/LOCODE port lookup (BUILD_SPEC §M5.3). Fuzzy match against
// data/unlocode.json — UNECE UN/LOCODE 2025-1 filtered to maritime ports
// (Function position 1 = '1'); provenance in scripts/build-unlocode.mjs.
//
// IMPORTANT verdict semantics: a code that is missing from the dataset is a
// WARN, never a fail. The dataset is trimmed to port-function entries and
// UNECE has reassigned some famous codes (CNSHA is now Hongqiao Airport;
// the Port of Shanghai is CNSGH) while real-world B/Ls still print the old
// codes. Only a name↔code contradiction we can prove is a fail.

import type { PortRef } from "@/lib/ai/schemas/shared";
import { UNLOCODE_DATASET, UNLOCODE_PROVENANCE, UNLOCODE_RELEASE } from "@/lib/standards/unlocode";
import { levenshtein, normalizeText } from "./normalize";
import type { ValidationResult } from "./types";

export interface PortMatch {
  code: string;
  name: string;
  /** 1 = exact normalized name match. */
  score: number;
}

const PORTS = UNLOCODE_DATASET.ports;

/**
 * UNECE's 2020-2 release reassigned several major Chinese port codes to
 * airports/cities and gave the seaports new codes; ocean B/Ls still
 * overwhelmingly print the old ones. Recognize both. Every target code
 * verified present in data/unlocode.json (2025-1).
 */
export const LEGACY_PORT_ALIASES: Record<string, string> = {
  CNSHA: "CNSGH", // Shanghai
  CNNGB: "CNNBG", // Ningbo
  CNTAO: "CNQDG", // Qingdao
  CNDLC: "CNDAG", // Dalian
  CNXMN: "CNXMG", // Xiamen
  CNTSN: "CNTNG", // Tianjin
  CNSZX: "CNSZP", // Shenzhen
  CNCAN: "CNGGZ", // Guangzhou
};

/** Historical/common port names that differ from the current UNECE spelling. */
export const PORT_NAME_ALIASES: Record<string, string> = {
  COCHIN: "KOCHI",
};

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
  const historicalAlias = PORT_NAME_ALIASES[normalizeText(beforeComma)];
  if (historicalAlias) push(historicalAlias);
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

export interface ResolvedPort {
  /** Current UN/LOCODE (alias target when the input was a legacy code). */
  code: string;
  name: string;
  /** The legacy code the document printed, when it was one. */
  legacy: string | null;
}

/** Code lookup that also recognizes well-known legacy codes. */
export function resolvePortCode(code: string): ResolvedPort | null {
  const c = code.toUpperCase().replace(/\s+/g, "");
  const direct = portNameForCode(c);
  if (direct) return { code: c, name: direct, legacy: null };
  const alias = LEGACY_PORT_ALIASES[c];
  if (alias) {
    const name = portNameForCode(alias);
    if (name) return { code: alias, name, legacy: c };
  }
  return null;
}

/**
 * Spec entry point: fuzzy port-name lookup. Returns the best match or null
 * when nothing scores ≥ minScore (default 0.75).
 */
export function unlocode(portName: string, minScore = 0.75): PortMatch | null {
  if (!byCode) buildIndexes();

  const raw = portName.trim();
  if (raw === "") return null;

  // Direct code input (legacy aliases resolve to the current code).
  if (looksLikeUnlocode(raw)) {
    const resolved = resolvePortCode(raw);
    if (resolved) return { code: resolved.code, name: resolved.name, score: 1 };
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
    const resolved = resolvePortCode(code);
    if (!resolved) {
      const suggested = port.name ? unlocode(port.name) : null;
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "warn",
        message: `${code} is not in our UN/LOCODE seaport list (${UNLOCODE_RELEASE}) — it may be an airport/city code or newer than our dataset${suggested ? `; the port name matches ${suggested.code} (${suggested.name})` : ""}`,
        expected: suggested?.code,
        actual: code,
      });
    } else if (!port.name || unlocodeNameAgrees(port.name, resolved.name)) {
      results.push(
        resolved.legacy
          ? {
              field: `${field}.unlocode`,
              rule: "unlocode",
              status: "pass",
              message: `${resolved.legacy} is the pre-2020 code for ${resolved.name} — current UN/LOCODE is ${resolved.code}`,
              expected: resolved.code,
              actual: resolved.legacy,
            }
          : {
              field: `${field}.unlocode`,
              rule: "unlocode",
              status: "pass",
              message: `${resolved.code} = ${resolved.name} (${UNLOCODE_PROVENANCE})`,
              actual: resolved.code,
            }
      );
    } else {
      const suggested = unlocode(port.name);
      results.push({
        field: `${field}.unlocode`,
        rule: "unlocode",
        status: "fail",
        message: `${code} is "${resolved.name}" in UN/LOCODE, but the document says "${port.name}"${suggested ? ` (did you mean ${suggested.code}?)` : ""}`,
        expected: suggested?.code,
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
