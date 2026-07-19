// Cross-document consistency check (BUILD_SPEC §M5.7). Pure function over
// a shipment's parsed documents → discrepancies rows. Severity: red =
// money/legal fields (parties, containers, amounts, ports); amber = rest.
// Currency/amount CI-vs-LC comparison is deferred per spec ("later").

import type {
  BillOfLadingFields,
  CommercialInvoiceFields,
  NormalizedExtraction,
  PackingListFields,
  Party,
} from "@/lib/ai/schemas/shared";
import { normalizeContainerNo } from "./container";
import { parsePrintedDate, daysBetween } from "./dates";
import { normalizeName } from "./normalize";
import type { Discrepancy } from "./types";
import { withinTolerance } from "./weights";

export interface ShipmentDoc {
  id: string;
  extraction: NormalizedExtraction;
}

/** Days an invoice may postdate the B/L before we flag it. */
export const INVOICE_AFTER_BL_TOLERANCE_DAYS = 7;

type BL = { id: string; f: BillOfLadingFields };
type CI = { id: string; f: CommercialInvoiceFields };
type PL = { id: string; f: PackingListFields };

function partiesDiffer(a: Party | null, b: Party | null): boolean {
  // Levenshtein > 0 after normalization = any difference in the keys.
  if (!a?.name || !b?.name) return false; // nothing provable
  return normalizeName(a.name) !== normalizeName(b.name);
}

function partyPair(
  field: string,
  aDoc: string,
  aParty: Party | null,
  bDoc: string,
  bParty: Party | null,
  label: string
): Discrepancy | null {
  if (!partiesDiffer(aParty, bParty)) return null;
  return {
    severity: "red",
    field,
    doc_a: aDoc,
    doc_b: bDoc,
    value_a: aParty?.name ?? null,
    value_b: bParty?.name ?? null,
    message: `${label} differs between documents`,
  };
}

/** Pull container-number tokens out of a free-text ref like "MSKU 685662-2". */
function containerTokens(refs: (string | null)[]): Set<string> {
  const out = new Set<string>();
  for (const ref of refs) {
    if (!ref) continue;
    const n = normalizeContainerNo(ref);
    const matches = n.match(/[A-Z]{4}\d{7}/g);
    if (matches) for (const m of matches) out.add(m);
    else if (/^[A-Z]{4}\d{6,7}$/.test(n)) out.add(n);
  }
  return out;
}

function incotermCode(s: string | null): string | null {
  if (!s) return null;
  const m = s.toUpperCase().match(/\b(EXW|FCA|CPT|CIP|DAP|DPU|DDP|FAS|FOB|CFR|CIF)\b/);
  return m ? m[1] : null;
}

/** Spec entry point: all pairwise cross-document rules for one shipment. */
export function crossCheck(docs: ShipmentDoc[]): Discrepancy[] {
  const out: Discrepancy[] = [];
  const bls: BL[] = [];
  const cis: CI[] = [];
  const pls: PL[] = [];
  for (const d of docs) {
    if (d.extraction.detected_type === "bill_of_lading")
      bls.push({ id: d.id, f: d.extraction.fields });
    else if (d.extraction.detected_type === "commercial_invoice")
      cis.push({ id: d.id, f: d.extraction.fields });
    else if (d.extraction.detected_type === "packing_list")
      pls.push({ id: d.id, f: d.extraction.fields });
  }

  const push = (d: Discrepancy | null) => {
    if (d) out.push(d);
  };

  // --- Parties (red) -------------------------------------------------------
  for (const bl of bls) {
    for (const ci of cis) {
      push(partyPair("shipper/seller", bl.id, bl.f.shipper, ci.id, ci.f.seller, "Shipper (B/L) vs seller (invoice)"));
      push(partyPair("consignee/buyer", bl.id, bl.f.consignee, ci.id, ci.f.buyer, "Consignee (B/L) vs buyer (invoice)"));
    }
    for (const pl of pls) {
      push(partyPair("shipper/seller", bl.id, bl.f.shipper, pl.id, pl.f.seller, "Shipper (B/L) vs seller (packing list)"));
      push(partyPair("consignee/buyer", bl.id, bl.f.consignee, pl.id, pl.f.buyer, "Consignee (B/L) vs buyer (packing list)"));
    }
  }
  for (const ci of cis) {
    for (const pl of pls) {
      push(partyPair("seller", ci.id, ci.f.seller, pl.id, pl.f.seller, "Seller (invoice) vs seller (packing list)"));
      push(partyPair("buyer", ci.id, ci.f.buyer, pl.id, pl.f.buyer, "Buyer (invoice) vs buyer (packing list)"));
    }
  }

  // --- Container sets (red) ------------------------------------------------
  for (const bl of bls) {
    const blSet = containerTokens(bl.f.containers.map((c) => c.container_no));
    for (const pl of pls) {
      const plSet = containerTokens(pl.f.container_refs);
      if (blSet.size === 0 || plSet.size === 0) continue;
      const missing = [...blSet].filter((c) => !plSet.has(c));
      const extra = [...plSet].filter((c) => !blSet.has(c));
      if (missing.length > 0 || extra.length > 0) {
        out.push({
          severity: "red",
          field: "containers",
          doc_a: bl.id,
          doc_b: pl.id,
          value_a: [...blSet].sort().join(", "),
          value_b: [...plSet].sort().join(", "),
          message: "Container sets differ between B/L and packing list",
        });
      }
    }
  }

  // --- Port pairs across multiple B/Ls (red) -------------------------------
  for (let i = 0; i < bls.length; i++) {
    for (let j = i + 1; j < bls.length; j++) {
      for (const key of ["port_of_load", "port_of_discharge"] as const) {
        const a = bls[i].f[key];
        const b = bls[j].f[key];
        const av = a?.unlocode ?? a?.name ?? null;
        const bv = b?.unlocode ?? b?.name ?? null;
        if (!av || !bv) continue;
        const same =
          (a?.unlocode && b?.unlocode && a.unlocode.toUpperCase() === b.unlocode.toUpperCase()) ||
          (a?.name && b?.name && normalizeName(a.name) === normalizeName(b.name));
        if (!same) {
          out.push({
            severity: "red",
            field: key,
            doc_a: bls[i].id,
            doc_b: bls[j].id,
            value_a: av,
            value_b: bv,
            message: `${key === "port_of_load" ? "Port of load" : "Port of discharge"} differs between B/Ls`,
          });
        }
      }
    }
  }

  // --- Incoterm equality (amber) -------------------------------------------
  for (const bl of bls) {
    for (const ci of cis) {
      const a = incotermCode(bl.f.incoterm);
      const b = incotermCode(ci.f.incoterm);
      if (a && b && a !== b) {
        out.push({
          severity: "amber",
          field: "incoterm",
          doc_a: bl.id,
          doc_b: ci.id,
          value_a: bl.f.incoterm,
          value_b: ci.f.incoterm,
          message: `Incoterm differs: ${a} on B/L vs ${b} on invoice`,
        });
      }
    }
  }

  // --- Weight totals (amber) -----------------------------------------------
  for (const bl of bls) {
    for (const pl of pls) {
      if (
        bl.f.total_gross_kg !== null &&
        pl.f.total_gross_kg !== null &&
        !withinTolerance(bl.f.total_gross_kg, pl.f.total_gross_kg)
      ) {
        out.push({
          severity: "amber",
          field: "total_gross_kg",
          doc_a: bl.id,
          doc_b: pl.id,
          value_a: String(bl.f.total_gross_kg),
          value_b: String(pl.f.total_gross_kg),
          message: "Total gross weight differs between B/L and packing list (±0.5%)",
        });
      }
    }
  }
  // CI carries weights per line only; compare its line-sum against PL total.
  for (const ci of cis) {
    const lineGross = ci.f.line_items
      .map((l) => l.gross_kg)
      .filter((g): g is number => g !== null);
    if (lineGross.length === 0) continue;
    const ciSum = lineGross.reduce((a, b) => a + b, 0);
    for (const pl of pls) {
      if (pl.f.total_gross_kg !== null && !withinTolerance(ciSum, pl.f.total_gross_kg)) {
        out.push({
          severity: "amber",
          field: "total_gross_kg",
          doc_a: ci.id,
          doc_b: pl.id,
          value_a: String(ciSum),
          value_b: String(pl.f.total_gross_kg),
          message: "Invoice line weights don't add up to the packing-list total (±0.5%)",
        });
      }
    }
  }

  // --- Package counts (amber) ----------------------------------------------
  for (const bl of bls) {
    for (const pl of pls) {
      if (
        bl.f.total_packages !== null &&
        pl.f.total_cartons !== null &&
        bl.f.total_packages !== pl.f.total_cartons
      ) {
        out.push({
          severity: "amber",
          field: "total_packages",
          doc_a: bl.id,
          doc_b: pl.id,
          value_a: String(bl.f.total_packages),
          value_b: String(pl.f.total_cartons),
          message: "Package count on B/L differs from carton count on packing list",
        });
      }
    }
  }

  // --- Invoice date vs B/L date (amber) --------------------------------------
  for (const ci of cis) {
    const inv = ci.f.invoice_date ? parsePrintedDate(ci.f.invoice_date) : null;
    if (!inv) continue;
    for (const bl of bls) {
      const blDateStr = bl.f.shipped_on_board_date ?? bl.f.issue_date;
      const blDate = blDateStr ? parsePrintedDate(blDateStr) : null;
      if (!blDate) continue;
      if (daysBetween(blDate, inv) > INVOICE_AFTER_BL_TOLERANCE_DAYS) {
        out.push({
          severity: "amber",
          field: "invoice_date",
          doc_a: ci.id,
          doc_b: bl.id,
          value_a: ci.f.invoice_date,
          value_b: blDateStr,
          message: `Invoice is dated more than ${INVOICE_AFTER_BL_TOLERANCE_DAYS} days after the B/L date`,
        });
      }
    }
  }

  return out;
}
