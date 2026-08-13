export const ACCURACY_CATEGORIES = [
  "identifiers",
  "parties",
  "dates",
  "packages",
  "weights",
  "monetary_values",
  "line_tables",
] as const;

export type AccuracyCategory = (typeof ACCURACY_CATEGORIES)[number];

export type FieldExpectation = {
  path: string;
  value: unknown;
};

export type CorpusCase = {
  id: string;
  doc_type: string;
  workflows: string[];
  labels: Partial<Record<AccuracyCategory, FieldExpectation[]>>;
};

export type CategoryScore = {
  passed: number;
  total: number;
  accuracy: number;
};

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

function normalize(value: unknown): unknown {
  if (typeof value === "string") {
    return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleUpperCase("en");
  }
  if (typeof value === "number") return Math.round(value * 1000) / 1000;
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)])
    );
  }
  return value;
}

export function expectationMatches(actual: unknown, expected: unknown) {
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected));
}

export function scoreCorpusCase(testCase: CorpusCase, extraction: unknown) {
  return Object.fromEntries(
    ACCURACY_CATEGORIES.map((category) => {
      const expectations = testCase.labels[category] ?? [];
      const passed = expectations.filter((item) =>
        expectationMatches(valueAtPath(extraction, item.path), item.value)
      ).length;
      return [category, {
        passed,
        total: expectations.length,
        accuracy: expectations.length ? Math.round((passed / expectations.length) * 10_000) / 100 : 100,
      } satisfies CategoryScore];
    })
  ) as Record<AccuracyCategory, CategoryScore>;
}

export function aggregateCategoryScores(scores: Record<AccuracyCategory, CategoryScore>[]) {
  return Object.fromEntries(
    ACCURACY_CATEGORIES.map((category) => {
      const passed = scores.reduce((sum, score) => sum + score[category].passed, 0);
      const total = scores.reduce((sum, score) => sum + score[category].total, 0);
      return [category, {
        passed,
        total,
        accuracy: total ? Math.round((passed / total) * 10_000) / 100 : 100,
      } satisfies CategoryScore];
    })
  ) as Record<AccuracyCategory, CategoryScore>;
}
