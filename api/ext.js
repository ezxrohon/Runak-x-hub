// Proxy for keyed extras: Watchmode (streaming links) and Trakt (ratings). Keys come from Vercel env vars.
module.exports = async (req, res) => {
  const { s, i, type } = req.query;
  if (typeof i !== "string" || !/^tt\d{5,10}$/.test(i)) return res.status(400).json({ error: "Bad id" });
  try {
    if (s === "trakt") {
      const key = process.env.TRAKT_CLIENT_ID;
      if (!key) return res.status(500).json({ error: "TRAKT_CLIENT_ID not set" });
      const kind = type === "tv" ? "shows" : "movies";
      const r = await fetch(`https://api.trakt.tv/${kind}/${i}/ratings`, {
        headers: { "trakt-api-key": key, "trakt-api-version": "2", "Content-Type": "application/json" },
      });
      const d = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
      return res.status(r.ok ? 200 : r.status).json({ rating: d.rating, votes: d.votes });
    }
    if (s === "watchmode") {
      const key = process.env.WATCHMODE_KEY;
      if (!key) return res.status(500).json({ error: "WATCHMODE_KEY not set" });
      const r = await fetch(`https://api.watchmode.com/v1/title/${i}/sources/?apiKey=${encodeURIComponent(key)}&regions=IN`);
      const d = await r.json();
      if (!Array.isArray(d)) return res.status(502).json({ error: "Upstream error" });
      const seen = new Set();
      const out = d.filter(x => ["sub", "free"].includes(x.type) && x.web_url && !seen.has(x.name) && seen.add(x.name))
        .slice(0, 12).map(x => ({ name: x.name, type: x.type, url: x.web_url }));
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
      return res.status(200).json(out);
    }
    return res.status(400).json({ error: "Unknown source" });
  } catch (e) { return res.status(502).json({ error: "Upstream failed" }); }
};
