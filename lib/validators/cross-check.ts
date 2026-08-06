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
import { dangerousGoodsOf, normalizeUnNumber, supportsDangerousGoods } from "./dangerous-goods";

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
// Tolerates a missing list, not just missing entries. The normalizer fills
// `containers` and `container_refs` with an array, but matching is now
// reachable from POST /v1/shipments/{id}/match, so it runs against whatever is
// stored on the row — including documents written by an older schema. A
// crashing cross-check would fail the whole run with a 500 rather than
// returning the findings it did compute.
function containerTokens(refs: (string | null)[] | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const ref of refs ?? []) {
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

function normalizedRef(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
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
    const blSet = containerTokens((bl.f.containers ?? []).map((c) => c.container_no));
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

  // --- Commercial references (red) ----------------------------------------
  for (const bl of bls) {
    for (const ci of cis) {
      if (bl.f.purchase_order_refs.length > 0 && ci.f.po_no) {
        const invoicePo = normalizedRef(ci.f.po_no);
        if (!bl.f.purchase_order_refs.some((ref) => normalizedRef(ref) === invoicePo)) {
          out.push({
            severity: "red", field: "po_number", doc_a: bl.id, doc_b: ci.id,
            value_a: bl.f.purchase_order_refs.join(", "), value_b: ci.f.po_no,
            message: "Purchase-order reference differs between B/L and invoice",
          });
        }
      }
      if (bl.f.lc_number && ci.f.lc_number && normalizedRef(bl.f.lc_number) !== normalizedRef(ci.f.lc_number)) {
        out.push({
          severity: "red", field: "lc_number", doc_a: bl.id, doc_b: ci.id,
          value_a: bl.f.lc_number, value_b: ci.f.lc_number,
          message: "Letter-of-credit reference differs between B/L and invoice",
        });
      }
    }
  }

  // --- Weight totals (amber) -----------------------------------------------
  for (const bl of bls) {
    for (const pl of pls) {
      for (const [field, blValue, plValue, label] of [
        ["total_net_kg", bl.f.total_net_kg, pl.f.total_net_kg, "Total net weight"],
        ["total_volume_cbm", bl.f.total_volume_cbm, pl.f.total_volume_cbm, "Total volume"],
      ] as const) {
        if (blValue !== null && plValue !== null && !withinTolerance(blValue, plValue)) {
          out.push({
            severity: "amber", field, doc_a: bl.id, doc_b: pl.id,
            value_a: String(blValue), value_b: String(plValue),
            message: `${label} differs between B/L and packing list (±0.5%)`,
          });
        }
      }
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

  // --- Dangerous-goods declarations (red/amber) ----------------------------
  // Compare every document that can legitimately carry a DG declaration.
  // A conflicting class/group is a safety failure; a missing declaration is
  // surfaced for human review because omission requirements vary by document.
  const dgDocs = docs
    .filter((doc) => supportsDangerousGoods(doc.extraction))
    .map((doc) => ({ id: doc.id, rows: dangerousGoodsOf(doc.extraction) }))
  if (dgDocs.some((doc) => doc.rows.length > 0)) {
  for (let i = 0; i < dgDocs.length; i++) {
    for (let j = i + 1; j < dgDocs.length; j++) {
      const aByUn = new Map(dgDocs[i].rows.flatMap((row) => {
        const un = normalizeUnNumber(row.un_number);
        return un ? [[un, row] as const] : [];
      }));
      const bByUn = new Map(dgDocs[j].rows.flatMap((row) => {
        const un = normalizeUnNumber(row.un_number);
        return un ? [[un, row] as const] : [];
      }));
      const allUn = new Set([...aByUn.keys(), ...bByUn.keys()]);
      for (const un of allUn) {
        const a = aByUn.get(un);
        const b = bByUn.get(un);
        if (!a || !b) {
          out.push({
            severity: "amber",
            field: "dangerous_goods",
            doc_a: dgDocs[i].id,
            doc_b: dgDocs[j].id,
            value_a: a ? un : null,
            value_b: b ? un : null,
            message: `${un} is declared on one dangerous-goods document but not the other`,
          });
          continue;
        }
        for (const [field, av, bv, label] of [
          ["hazard_class", a.hazard_class, b.hazard_class, "hazard class"],
          ["packing_group", a.packing_group, b.packing_group, "packing group"],
        ] as const) {
          if (av && bv && av.toUpperCase() !== bv.toUpperCase()) {
            out.push({
              severity: "red",
              field: `dangerous_goods.${field}`,
              doc_a: dgDocs[i].id,
              doc_b: dgDocs[j].id,
              value_a: av,
              value_b: bv,
              message: `${un} ${label} conflicts across documents`,
            });
          }
        }
      }
    }
  }
  }

  return out;
}
