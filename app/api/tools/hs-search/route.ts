type UsitcRow = { htsno?: string | null; description?: string | null; general?: string | null; special?: string | null; other?: string | null; units?: string[] | null };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) return Response.json({ error: "Enter a commodity description between 2 and 100 characters." }, { status: 400 });
  try {
    // The USITC endpoint treats multi-word input broadly. Searching the final
    // commodity noun avoids ranking a material-only result (for example cotton
    // linters) ahead of the requested product (cotton shirts).
    const words = query.toLowerCase().match(/[a-z0-9-]+/g) ?? [];
    const searchTerm = words.at(-1) ?? query;
    const upstream = await fetch(`https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(searchTerm)}`, { headers: { Accept: "application/json" }, next: { revalidate: 86400 } });
    if (!upstream.ok) throw new Error(`USITC ${upstream.status}`);
    const rows = await upstream.json() as UsitcRow[];
    const results = rows.filter((row) => row.htsno && row.description && row.description.toLowerCase().includes(searchTerm)).sort((a, b) => (b.htsno?.length ?? 0) - (a.htsno?.length ?? 0)).slice(0, 15).map((row) => ({ hts: row.htsno, hs6: row.htsno!.replace(/\D/g, "").slice(0, 6), description: row.description, generalRate: row.general || null, specialRate: row.special || null, otherRate: row.other || null, units: row.units ?? [] }));
    return Response.json({ results, source: "U.S. International Trade Commission HTS" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "The official tariff service is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
