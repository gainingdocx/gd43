import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { tolerantParse, repairJson, diffFields } from "./json";

describe("tolerantParse", () => {
  it("parses clean JSON", () => {
    assert.deepEqual(tolerantParse('{"a":1}'), { a: 1 });
  });

  it("strips markdown fences", () => {
    assert.deepEqual(tolerantParse('```json\n{"a":1}\n```'), { a: 1 });
  });

  it("strips leading prose before the object", () => {
    assert.deepEqual(tolerantParse('Here is the JSON: {"a":1}'), { a: 1 });
  });

  it("cuts trailing prose after a balanced object", () => {
    assert.deepEqual(
      tolerantParse('{"a":1}\nI hope this helps!'),
      { a: 1 }
    );
  });

  it("closes a truncated object (streamed prefix)", () => {
    assert.deepEqual(tolerantParse('{"a":1,"b":{"c":[1,2'), {
      a: 1,
      b: { c: [1, 2] },
    });
  });

  it("closes a truncated string value", () => {
    assert.deepEqual(tolerantParse('{"name":"MAERSK ESSE'), {
      name: "MAERSK ESSE",
    });
  });

  it("handles a dangling key (truncated after colon)", () => {
    assert.deepEqual(tolerantParse('{"a":1,"b":'), { a: 1, b: null });
  });

  it("handles a dangling comma", () => {
    assert.deepEqual(tolerantParse('{"a":1,'), { a: 1 });
  });

  it("removes trailing commas inside the object", () => {
    assert.deepEqual(tolerantParse('{"a":[1,2,],"b":{"c":1,},}'), {
      a: [1, 2],
      b: { c: 1 },
    });
  });

  it("ignores brackets inside strings", () => {
    assert.deepEqual(tolerantParse('{"a":"b}c{d","e":['), {
      a: "b}c{d",
      e: [],
    });
  });

  it("handles escaped quotes inside strings", () => {
    assert.deepEqual(tolerantParse('{"a":"say \\"hi\\"","b":1'), {
      a: 'say "hi"',
      b: 1,
    });
  });

  it("returns null for hopeless input", () => {
    assert.equal(tolerantParse("no json here at all"), null);
    assert.equal(tolerantParse(""), null);
  });

  it("progressively parses a realistic stream", () => {
    const full =
      '{"detected_type":"bill_of_lading","fields":{"bl_number":"MAEU123456789","containers":[{"container_no":"MSKU1234565","gross_kg":21500.5}],"total_gross_kg":21500.5}}';
    for (const cut of [15, 40, 70, 100, 130, full.length]) {
      const parsed = tolerantParse(full.slice(0, cut));
      assert.notEqual(parsed, null, `parse failed at cut=${cut}`);
    }
    assert.deepEqual(tolerantParse(full), JSON.parse(full));
  });
});

describe("repairJson", () => {
  it("throws on unrecoverable input", () => {
    assert.throws(() => repairJson("total garbage"));
  });
  it("returns the repaired value", () => {
    assert.deepEqual(repairJson('{"a":1,'), { a: 1 });
  });
});

describe("diffFields", () => {
  it("emits nothing when equal", () => {
    assert.deepEqual(diffFields({ a: 1 }, { a: 1 }), []);
  });

  it("emits changed primitives with dotted paths", () => {
    assert.deepEqual(diffFields({ a: { b: 1 } }, { a: { b: 2, c: "x" } }), [
      { path: "a.b", value: 2 },
      { path: "a.c", value: "x" },
    ]);
  });

  it("treats arrays as leaves", () => {
    assert.deepEqual(diffFields({ a: [1] }, { a: [1, 2] }), [
      { path: "a", value: [1, 2] },
    ]);
  });

  it("emits everything against an empty previous snapshot", () => {
    assert.deepEqual(diffFields(undefined, { a: 1, b: { c: null } }), [
      { path: "a", value: 1 },
      { path: "b.c", value: null },
    ]);
  });
});
