import assert from "node:assert/strict";
import test from "node:test";

import { evaluateParseHealth } from "./health";

test("requires a minimum sample before alerting", () => {
  assert.deepEqual(evaluateParseHealth({ requests: 4, successes: 0, failures: 4, rejected: 0, review_required: 0, average_quality: 20, average_duration_ms: 200000, p95_duration_ms: 250000 }), []);
});

test("detects error, latency and quality breaches independently", () => {
  assert.deepEqual(evaluateParseHealth({ requests: 20, successes: 15, failures: 5, rejected: 0, review_required: 3, average_quality: 54, average_duration_ms: 90000, p95_duration_ms: 190000 }).map((item) => item.key), ["parse_error_rate", "parse_p95_latency", "parse_average_quality"]);
});
