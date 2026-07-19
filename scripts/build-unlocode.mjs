// Builds data/unlocode.json — trimmed UN/LOCODE seaport dataset (BUILD_SPEC §M5.3).
//
// PROVENANCE
//   Source:  UNECE UN/LOCODE list, release 2024-2
//            https://unece.org/trade/cefact/UNLOCODE-Download
//   Via:     https://github.com/datasets/un-locode (mirror, datapackage
//            version 2024.2.0), file data/code-list.csv
//   License: ODC-PDDL-1.0 (public domain dedication)
//   Filter:  Function position 1 = '1' (maritime port), Status != 'XX'
//            (entries marked for removal), country header rows dropped.
//   Fields kept per entry: [UN/LOCODE (5 chars), name without diacritics]
//
// Usage: node scripts/build-unlocode.mjs [path-to-code-list.csv]
//        (downloads the mirror CSV when no path is given)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CSV_URL =
  "https://raw.githubusercontent.com/datasets/un-locode/main/data/code-list.csv";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "unlocode.json");

async function loadCsv() {
  const arg = process.argv[2];
  if (arg) return readFileSync(arg, "utf8");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  return res.text();
}

/** Minimal CSV parser (handles quoted fields containing commas/quotes). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

const csv = await loadCsv();
const rows = parseCsv(csv);
const header = rows.shift();
const col = Object.fromEntries(header.map((h, i) => [h, i]));

const ports = [];
const seen = new Set();
for (const r of rows) {
  const country = r[col.Country]?.trim();
  const location = r[col.Location]?.trim();
  const status = r[col.Status]?.trim();
  const fn = r[col.Function] ?? "";
  const name = (r[col.NameWoDiacritics] || r[col.Name] || "").trim();
  if (!country || !location || !name) continue; // country header rows
  if (name.startsWith(".")) continue;
  if (fn[0] !== "1") continue; // not a maritime port
  if (status === "XX") continue; // marked for removal
  const code = country + location;
  if (seen.has(code)) continue;
  seen.add(code);
  ports.push([code, name]);
}

ports.sort((a, b) => (a[0] < b[0] ? -1 : 1));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: "UNECE UN/LOCODE 2024-2 via github.com/datasets/un-locode (ODC-PDDL-1.0)",
      built: new Date().toISOString().slice(0, 10),
      filter: "Function[0]='1' (port), Status!='XX'",
      count: ports.length,
      ports,
    },
    null,
    0
  ) + "\n",
  "utf8"
);
console.log(`wrote ${ports.length} ports -> ${OUT}`);
