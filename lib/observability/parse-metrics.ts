import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logWarn } from "./logger";

export type ParseMetric = {
  requestId: string;
  owner?: string | null;
  channel: "web" | "api" | "email";
  outcome: "success" | "failed" | "rejected";
  documentType?: string | null;
  provider?: string | null;
  model?: string | null;
  pageCount: number;
  durationMs: number;
  qualityScore?: number | null;
  escalated?: boolean;
  blockingFailures?: number;
  failureCode?: string | null;
};

/** Best-effort and content-free: telemetry must never break a shipment parse. */
export async function recordParseMetric(metric: ParseMetric) {
  const { error } = await createAdminClient().from("parse_metrics").insert({
    request_id: metric.requestId,
    owner: metric.owner ?? null,
    channel: metric.channel,
    outcome: metric.outcome,
    document_type: metric.documentType ?? null,
    provider: metric.provider ?? null,
    model: metric.model ?? null,
    page_count: metric.pageCount,
    duration_ms: metric.durationMs,
    quality_score: metric.qualityScore ?? null,
    escalated: metric.escalated ?? false,
    blocking_failures: metric.blockingFailures ?? 0,
    failure_code: metric.failureCode ?? null,
  });
  if (error) logWarn("parse_metric_write_failed", { requestId: metric.requestId, errorCode: error.code });
}
