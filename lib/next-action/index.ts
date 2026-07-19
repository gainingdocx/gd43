// Next Action Engine (BUILD_SPEC §M6). Pure decision function: given what
// exists, say what the user should do next. Max 1 primary + 2 secondary
// per surface. No I/O here — callers fetch, this ranks.

export interface NextActionDoc {
  id: string;
  doc_type: "bill_of_lading" | "commercial_invoice" | "packing_list" | "other";
  status: "uploaded" | "parsing" | "parsed" | "failed";
  /** Count of status==='fail' entries in documents.validation. */
  validation_fails: number;
  shipment_id: string | null;
}

export interface NextActionInput {
  docs: NextActionDoc[];
  /** Open (unresolved) discrepancies across the surface's shipments. */
  openDiscrepancies: { severity: "red" | "amber"; shipment_id: string }[];
  /** Shipments on this surface that have ever run a check. */
  checkedShipmentIds: string[];
}

export interface Action {
  id: string;
  role: "primary" | "secondary";
  label: string;
  description: string;
  href: string;
}

const byNewest = <T,>(xs: T[]): T | undefined => xs[0];

/**
 * Ranked rule list — first match becomes primary, next two secondary.
 * Order encodes the product's opinion: fix problems before adding work.
 */
export function suggest(input: NextActionInput): Action[] {
  const { docs, openDiscrepancies, checkedShipmentIds } = input;
  const parsed = docs.filter((d) => d.status === "parsed");
  const bls = parsed.filter((d) => d.doc_type === "bill_of_lading");
  const cis = parsed.filter((d) => d.doc_type === "commercial_invoice");
  const pls = parsed.filter((d) => d.doc_type === "packing_list");
  const candidates: Action[] = [];

  // 1. Unresolved discrepancies — resolve before anything else.
  const red = openDiscrepancies.find((d) => d.severity === "red");
  const openDisc = red ?? openDiscrepancies[0];
  if (openDisc) {
    candidates.push({
      id: "resolve-discrepancies",
      role: "primary",
      label: "Resolve discrepancies",
      description: red
        ? "A red discrepancy affects money/legal fields — settle which document is right."
        : "Your documents disagree on some fields.",
      href: `/app/shipments/${openDisc.shipment_id}`,
    });
  }

  // 2. Validation failures on a parsed doc — review the flagged fields.
  const failing = byNewest(parsed.filter((d) => d.validation_fails > 0));
  if (failing) {
    candidates.push({
      id: "review-flagged",
      role: "primary",
      label: "Review flagged fields",
      description: "Deterministic checks failed on this document (check digits, weights or dates).",
      href: `/app/review/${failing.id}`,
    });
  }

  // 3. Failed parse — retry.
  const failed = byNewest(docs.filter((d) => d.status === "failed"));
  if (failed) {
    candidates.push({
      id: "retry-parse",
      role: "primary",
      label: "Retry failed parse",
      description: "The last parse did not finish.",
      href: "/app/scan",
    });
  }

  // 4. B/L + counterpart in one shipment, never cross-checked → run check.
  const uncheckedShipment = bls
    .map((b) => b.shipment_id)
    .find(
      (sid) =>
        sid !== null &&
        !checkedShipmentIds.includes(sid) &&
        parsed.some((d) => d.shipment_id === sid && d.doc_type !== "bill_of_lading")
    );
  if (uncheckedShipment) {
    candidates.push({
      id: "run-shipment-check",
      role: "primary",
      label: "Run Shipment Check",
      description: "Cross-check the B/L against the other documents in this shipment.",
      href: `/app/shipments/${uncheckedShipment}`,
    });
  }

  // 5. CI without a PL → generate the packing list (and vice versa).
  if (cis.length > 0 && pls.length === 0) {
    candidates.push({
      id: "generate-pl",
      role: "primary",
      label: "Generate packing list",
      description: "You have an invoice but no packing list — create one from its lines.",
      href: `/app/review/${cis[0].id}?generate=packing_list`,
    });
  }
  if (pls.length > 0 && cis.length === 0) {
    candidates.push({
      id: "generate-ci",
      role: "primary",
      label: "Generate commercial invoice",
      description: "You have a packing list but no invoice.",
      href: `/app/review/${pls[0].id}?generate=commercial_invoice`,
    });
  }

  // 6. Lone parsed doc with no shipment → group it.
  const ungrouped = byNewest(parsed.filter((d) => d.shipment_id === null));
  if (ungrouped && parsed.length > 1) {
    candidates.push({
      id: "add-to-shipment",
      role: "secondary",
      label: "Add to a shipment",
      description: "Group this document with the rest of its shipment.",
      href: `/app/review/${ungrouped.id}`,
    });
  }

  // 7. Parsed B/L → keep an eye on the box.
  if (bls.length > 0) {
    candidates.push({
      id: "review-bl",
      role: "secondary",
      label: "Open latest B/L",
      description: "Check extracted fields and container numbers.",
      href: `/app/review/${bls[0].id}`,
    });
  }

  // 8. Nothing yet (or nothing actionable) → scan.
  candidates.push({
    id: "scan",
    role: docs.length === 0 ? "primary" : "secondary",
    label: docs.length === 0 ? "Scan your first document" : "Scan another document",
    description:
      docs.length === 0
        ? "Upload or photograph a B/L, invoice or packing list."
        : "Add the next document to your workspace.",
    href: "/app/scan",
  });

  // Cap: the first candidate is primary, the next two are secondary.
  return candidates.slice(0, 3).map((a, i) => ({
    ...a,
    role: i === 0 ? "primary" : "secondary",
  }));
}
