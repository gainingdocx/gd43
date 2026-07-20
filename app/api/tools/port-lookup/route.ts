import { NextRequest, NextResponse } from "next/server";
import data from "@/data/unlocode.json";

export const dynamic = "force-dynamic";

function normalized(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const q = normalized(raw);
  if (q.length < 2) return NextResponse.json({ results: [], source: data.source });

  const ranked: { code: string; name: string; score: number }[] = [];
  for (const [code, name] of data.ports as [string, string][]) {
    const c = code.toLowerCase();
    const n = normalized(name);
    let score = 0;
    if (c === q || n === q) score = 100;
    else if (c.startsWith(q)) score = 90;
    else if (n.startsWith(q)) score = 80;
    else if (n.split(" ").some((word) => word.startsWith(q))) score = 70;
    else if (c.includes(q)) score = 60;
    else if (n.includes(q)) score = 50;
    if (score) ranked.push({ code, name, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return NextResponse.json(
    { results: ranked.slice(0, 20).map(({ code, name }) => ({ code, name })), source: data.source },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
