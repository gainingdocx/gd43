import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DETECTED_TYPES } from "../ai/schemas/shared";
import { FLAGSHIP_WORKFLOW_KEYS } from "../workflows/flagship";
import { ACCURACY_CATEGORIES, type CorpusCase } from "./score";

type Manifest = {
  version: string;
  label_review: { status: string; required_role: string };
  category_thresholds: Record<string, number>;
  cases: CorpusCase[];
};

async function manifest() {
  return JSON.parse(await readFile("regression/corpus/v1/manifest.json", "utf8")) as Manifest;
}

test("regression corpus covers every supported document type and flagship workflow", async () => {
  const value = await manifest();
  assert.match(value.version, /^1\./);
  assert.ok(value.label_review.required_role.length > 20);
  assert.ok(["pending_domain_expert_signoff", "approved"].includes(value.label_review.status));

  const ids = value.cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "corpus case IDs must be unique");
  assert.deepEqual(
    [...new Set(value.cases.map((item) => item.doc_type))].sort(),
    [...DETECTED_TYPES].sort()
  );
  assert.deepEqual(
    [...new Set(value.cases.flatMap((item) => item.workflows))].sort(),
    [...FLAGSHIP_WORKFLOW_KEYS].sort()
  );
});

test("regression corpus defines separate labels and launch thresholds for every accuracy category", async () => {
  const value = await manifest();
  for (const category of ACCURACY_CATEGORIES) {
    assert.ok(
      value.cases.some((item) => (item.labels[category]?.length ?? 0) > 0),
      `missing ${category} labels`
    );
    assert.ok(
      Number.isFinite(value.category_thresholds[category]) && value.category_thresholds[category] >= 90,
      `missing production threshold for ${category}`
    );
  }
});

test("every golden label has an explicit field path and non-null value", async () => {
  const value = await manifest();
  for (const testCase of value.cases) {
    const labels = Object.values(testCase.labels).flat();
    assert.ok(labels.length > 0, `${testCase.id} has no labels`);
    for (const label of labels) {
      assert.match(label.path, /^(detected_type|fields\.)/);
      assert.notEqual(label.value, null);
      assert.notEqual(label.value, "");
    }
  }
});
