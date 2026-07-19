// Discrepancy resolver mapping (BUILD_SPEC §M6.4): when the user says
// "document X is right", where in the losing document does the winning
// value get written? null = no safe automatic write (sets/ports) — the
// discrepancy is just marked resolved.

export function correctionPath(
  discrepancyField: string,
  losingDocType: string
): string | null {
  switch (discrepancyField) {
    case "shipper/seller":
      return losingDocType === "bill_of_lading" ? "shipper.name" : "seller.name";
    case "consignee/buyer":
      return losingDocType === "bill_of_lading" ? "consignee.name" : "buyer.name";
    case "seller":
      return "seller.name";
    case "buyer":
      return "buyer.name";
    case "incoterm":
      return "incoterm";
    case "total_gross_kg":
      // A CI has no total_gross_kg field — nothing safe to write.
      return losingDocType === "commercial_invoice" ? null : "total_gross_kg";
    case "total_packages":
      return losingDocType === "packing_list" ? "total_cartons" : "total_packages";
    case "invoice_date":
      return losingDocType === "commercial_invoice" ? "invoice_date" : null;
    default:
      // containers / port pairs: set-valued or ambiguous — resolve only.
      return null;
  }
}

/** Numeric fields must be written back as numbers. */
export function coerceCorrection(path: string, value: string): unknown {
  if (/total_gross_kg|total_packages|total_cartons/.test(path)) {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : value;
  }
  return value;
}
