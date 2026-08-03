export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = (url.searchParams.get("country") ?? "").toUpperCase();
  const year = Number(url.searchParams.get("year"));
  if (!/^[A-Z]{2}$/.test(country) || !Number.isInteger(year) || year < 2020 || year > 2035) return Response.json({ error: "Use an ISO country code and year from 2020 to 2035." }, { status: 400 });
  try {
    const response = await fetch(`https://date.nager.at/api/v4/Holidays/${country}/${year}`, { headers: { Accept: "application/json", "User-Agent": "GainingDocx-Free-Time-Audit/1.0" }, signal: AbortSignal.timeout(8_000), next: { revalidate: 86_400 } });
    if (!response.ok) return Response.json({ error: "No supported calendar was returned for that country and year." }, { status: 404 });
    const raw = await response.json() as Array<{ date?: unknown; name?: unknown; nationalHoliday?: unknown; holidayTypes?: unknown }>;
    const holidays = raw.flatMap((item) => typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Array.isArray(item.holidayTypes) && item.holidayTypes.includes("Public") ? [{ date: item.date, name: typeof item.name === "string" ? item.name : "Public holiday", national: item.nationalHoliday === true }] : []);
    return Response.json({ country, year, source: "Nager.Date public holiday API", holidays }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return Response.json({ error: "The holiday calendar service is temporarily unavailable." }, { status: 503 });
  }
}
