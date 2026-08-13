export type ParseHealthTotals = {
  requests: number;
  successes: number;
  failures: number;
  rejected: number;
  review_required: number;
  average_quality: number | null;
  average_duration_ms: number | null;
  p95_duration_ms: number | null;
};

export type HealthBreach = { key: string; severity: "warning" | "critical"; title: string; value: number; threshold: number };

export function evaluateParseHealth(totals: ParseHealthTotals): HealthBreach[] {
  if (totals.requests < 5) return [];
  const breaches: HealthBreach[] = [];
  const attempted = Math.max(1, totals.successes + totals.failures);
  const errorRate = (totals.failures / attempted) * 100;
  if (errorRate >= 10) breaches.push({ key: "parse_error_rate", severity: errorRate >= 25 ? "critical" : "warning", title: "Document parsing error rate is elevated", value: errorRate, threshold: 10 });
  if ((totals.p95_duration_ms ?? 0) >= 120_000) breaches.push({ key: "parse_p95_latency", severity: (totals.p95_duration_ms ?? 0) >= 180_000 ? "critical" : "warning", title: "Document parsing latency is elevated", value: totals.p95_duration_ms ?? 0, threshold: 120_000 });
  if (totals.average_quality !== null && totals.average_quality < 70) breaches.push({ key: "parse_average_quality", severity: totals.average_quality < 55 ? "critical" : "warning", title: "Average extraction quality is below the operating floor", value: totals.average_quality, threshold: 70 });
  return breaches;
}
