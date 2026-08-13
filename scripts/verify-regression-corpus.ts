import { readFile } from "node:fs/promises";

import {
  ACCURACY_CATEGORIES,
  aggregateCategoryScores,
  scoreCorpusCase,
  type AccuracyCategory,
  type CorpusCase,
} from "../lib/regression/score";

type Manifest = {
  version: string;
  label_review: { status: string };
  category_thresholds: Record<AccuracyCategory, number>;
  cases: CorpusCase[];
};

async function main() {
  const manifest = JSON.parse(
    await readFile("regression/corpus/v1/manifest.json", "utf8")
  ) as Manifest;
  const live = process.argv.includes("--live");

  if (!live) {
  const report = {
    version: manifest.version,
    cases: manifest.cases.length,
    documentTypes: new Set(manifest.cases.map((item) => item.doc_type)).size,
    workflows: new Set(manifest.cases.flatMap((item) => item.workflows)).size,
    labelReview: manifest.label_review.status,
    labelsByCategory: Object.fromEntries(ACCURACY_CATEGORIES.map((category) => [
      category,
      manifest.cases.reduce((sum, item) => sum + (item.labels[category]?.length ?? 0), 0),
    ])),
  };
  console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required for --live");

  const { parseDocumentInputs } = await import("../lib/ai/router");
  const { readFile: readPdf } = await import("node:fs/promises");
  const results = [];
  for (const testCase of manifest.cases) {
    const bytes = await readPdf(`tmp/pdfs/regression-corpus-v1/${testCase.id}.pdf`);
    const result = await parseDocumentInputs([{
      kind: "pdf",
      filename: `${testCase.id}.pdf`,
      url: `data:application/pdf;base64,${bytes.toString("base64")}`,
    }], testCase.doc_type);
    const scores = scoreCorpusCase(testCase, result.extraction);
    results.push({ id: testCase.id, model: result.model, qualityScore: result.qualityScore, scores });
    console.log(JSON.stringify(results.at(-1)));
  }

  const aggregate = aggregateCategoryScores(results.map((item) => item.scores));
  const failed = ACCURACY_CATEGORIES.filter(
    (category) => aggregate[category].accuracy < manifest.category_thresholds[category]
  );
  console.log(JSON.stringify({ aggregate, thresholds: manifest.category_thresholds, failed }, null, 2));
  if (failed.length || manifest.label_review.status !== "approved") process.exitCode = 1;
}

void main();
