function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isMissing(value: unknown) {
  return value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

export function evidenceSupports(quote: string | null, value: unknown) {
  if (!quote || isMissing(value)) return false;
  if (typeof value === "number") {
    const numbers = quote.match(/[-+]?\d[\d,.]*(?:\.\d+)?/g) ?? [];
    return numbers.some((token) => {
      const parsed = Number(token.replace(/,/g, ""));
      return Number.isFinite(parsed) &&
        Math.abs(parsed - value) <= Math.max(.001, Math.abs(value) * .00001);
    });
  }
  const normalizedValue = String(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
  const normalizedQuote = quote.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return normalizedValue.length >= 3 && normalizedQuote.includes(normalizedValue);
}

export function rowsMatchOwnTotal(rows: unknown, root: Record<string, unknown>) {
  if (!Array.isArray(rows)) return false;
  const counts = rows.flatMap((row) => {
    if (!isObject(row)) return [];
    const raw = typeof row.packages === "number" ? row.packages : row.cartons;
    return typeof raw === "number" && Number.isFinite(raw) ? [raw] : [];
  });
  const rowSum = counts.length >= 1 ? counts.reduce((sum, count) => sum + count, 0) : null;
  const rawTotal = root.total_packages ?? root.total_cartons;
  return rowSum !== null && typeof rawTotal === "number" &&
    Math.abs(rowSum - rawTotal) <= Math.max(.001, Math.abs(rawTotal) * .00001);
}
