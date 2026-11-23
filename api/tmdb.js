// Vercel serverless proxy: keeps your TMDB key in the TMDB_KEY environment variable.
// Works with either a v3 API key or a v4 read-access token.
module.exports = async (req, res) => {
  const key = process.env.TMDB_KEY;
  if (!key) return res.status(500).json({ error: "Server key missing: set TMDB_KEY" });
  const { path, ...rest } = req.query;
  if (typeof path !== "string" || !/^\/(search|discover|movie|tv|genre)(\/[A-Za-z0-9_-]+)*$/.test(path))
    return res.status(400).json({ error: "Bad path" });
  const url = new URL("https://api.themoviedb.org/3" + path);
  for (const [k, v] of Object.entries(rest)) if (typeof v === "string") url.searchParams.set(k, v);
  const headers = {};
  if (key.length > 40) headers.Authorization = "Bearer " + key;
  else url.searchParams.set("api_key", key);
  try {
    const r = await fetch(url, { headers });
    const data = await r.json();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Upstream failed" });
  }
};
