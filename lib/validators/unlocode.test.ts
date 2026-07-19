import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  looksLikeUnlocode,
  portNameForCode,
  unlocode,
  validatePort,
} from "./unlocode";
import { normalizeText, similarity, levenshtein } from "./normalize";

describe("normalize helpers", () => {
  it("normalizeText strips diacritics, punctuation and case", () => {
    assert.equal(normalizeText("Escàs"), "ESCAS");
    assert.equal(normalizeText("ACME Co., Ltd. "), "ACME CO LTD");
    assert.equal(normalizeText("  a\t b "), "A B");
  });

  it("levenshtein and similarity behave", () => {
    assert.equal(levenshtein("kitten", "sitting"), 3);
    assert.equal(levenshtein("", "abc"), 3);
    assert.equal(levenshtein("abc", ""), 3);
    assert.equal(similarity("Rotterdam", "ROTTERDAM."), 1);
    assert.equal(similarity("", ""), 1);
    assert.ok(similarity("Rotterdam", "Roterdam") > 0.85);
  });
});

describe("unlocode lookup", () => {
  it("exact name matches", () => {
    assert.equal(unlocode("Rotterdam")?.code, "NLRTM");
    assert.equal(unlocode("Singapore")?.code, "SGSIN");
    assert.equal(unlocode("Hamburg")?.code, "DEHAM");
  });

  it("resolves Shanghai to the 2024-2 port code CNSGH", () => {
    assert.equal(unlocode("Shanghai")?.code, "CNSGH");
  });

  it("strips generic port words from queries", () => {
    assert.equal(unlocode("Port of Hamburg")?.code, "DEHAM");
    assert.equal(unlocode("ROTTERDAM PORT")?.code, "NLRTM");
  });

  it("matches dataset names that carry generic suffixes", () => {
    assert.equal(unlocode("Yantian")?.code, "CNYTN"); // dataset: "Yantian Pt"
  });

  it("matches parenthesized alternate names", () => {
    assert.equal(unlocode("Nhava Sheva")?.code, "INNSA");
    assert.equal(unlocode("Jawaharlal Nehru")?.code, "INNSA");
  });

  it("handles country suffixes and qualifiers as printed on B/Ls", () => {
    assert.equal(unlocode("HELSINKI, FINLAND")?.code, "FIHEL");
    assert.equal(unlocode("NHAVA SHEVA (JNPT), INDIA")?.code, "INNSA");
    assert.equal(unlocode("Rotterdam, The Netherlands")?.code, "NLRTM");
  });

  it("fuzzy-matches small typos", () => {
    const m = unlocode("Roterdam");
    assert.equal(m?.code, "NLRTM");
    assert.ok(m!.score < 1 && m!.score >= 0.75);
  });

  it("accepts a UN/LOCODE directly, with or without a space", () => {
    assert.equal(unlocode("SGSIN")?.code, "SGSIN");
    assert.equal(unlocode("nl rtm")?.code, "NLRTM");
  });

  it("returns null for unknowns and empty input", () => {
    assert.equal(unlocode("Xqzvbn Qwrtp"), null);
    assert.equal(unlocode(""), null);
    assert.equal(unlocode("   "), null);
    assert.equal(unlocode("!!!"), null);
  });

  it("portNameForCode / looksLikeUnlocode", () => {
    assert.equal(portNameForCode("NLRTM"), "Rotterdam");
    assert.equal(portNameForCode("XXXXX"), null);
    assert.equal(looksLikeUnlocode("SG SIN"), true);
    assert.equal(looksLikeUnlocode("Rotterdam"), false);
  });
});

describe("validatePort", () => {
  it("returns nothing for absent ports", () => {
    assert.deepEqual(validatePort("port_of_load", null), []);
    assert.deepEqual(
      validatePort("port_of_load", { name: null, unlocode: null }),
      []
    );
  });

  it("pass when code and name agree", () => {
    const r = validatePort("port_of_load", {
      name: "ROTTERDAM",
      unlocode: "NLRTM",
    });
    assert.equal(r.length, 1);
    assert.equal(r[0].status, "pass");
    assert.equal(r[0].rule, "unlocode");
  });

  it("pass when only the code is present and known", () => {
    const r = validatePort("port_of_load", { name: null, unlocode: "SGSIN" });
    assert.equal(r[0].status, "pass");
  });

  it("warn (never fail) for codes outside the seaport dataset, e.g. legacy CNSHA", () => {
    const r = validatePort("port_of_load", {
      name: "SHANGHAI",
      unlocode: "CNSHA",
    });
    assert.equal(r[0].status, "warn");
    assert.match(r[0].message, /not in our UN\/LOCODE seaport list/);
  });

  it("fail when code and name contradict, with a suggestion", () => {
    const r = validatePort("port_of_discharge", {
      name: "Rotterdam",
      unlocode: "SGSIN",
    });
    assert.equal(r[0].status, "fail");
    assert.equal(r[0].expected, "NLRTM");
    assert.match(r[0].message, /did you mean NLRTM/);
  });

  it("name-only: pass with suggested code, warn when unmatchable", () => {
    const ok = validatePort("port_of_load", {
      name: "Jebel Ali",
      unlocode: null,
    });
    assert.equal(ok[0].status, "pass");
    assert.equal(ok[0].expected, "AEJEA");

    const nope = validatePort("port_of_load", {
      name: "Zzzyx Nowhere",
      unlocode: null,
    });
    assert.equal(nope[0].status, "warn");
  });
});
