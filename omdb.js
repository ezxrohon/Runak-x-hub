// Vercel proxy for OMDb (IMDb / Rotten Tomatoes / Metacritic ratings). Set OMDB_KEY in env (free key: omdbapi.com/apikey.aspx)
module.exports = async (req, res) => {
  const key = process.env.OMDB_KEY;
  if (!key) return res.status(500).json({ error: "OMDB_KEY not set" });
  const { i } = req.query;
  if (typeof i !== "string" || !/^tt\d{5,10}$/.test(i)) return res.status(400).json({ error: "Bad id" });
  try {
    const r = await fetch(`https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${i}`);
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json(await r.json());
  } catch (e) { return res.status(502).json({ error: "Upstream failed" }); }
};
