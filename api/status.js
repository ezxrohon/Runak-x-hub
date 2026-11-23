// Tells the site which server-side keys exist (booleans only, never the keys themselves).
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    tmdb: !!process.env.TMDB_KEY,
    omdb: !!process.env.OMDB_KEY,
    watchmode: !!process.env.WATCHMODE_KEY,
    trakt: !!process.env.TRAKT_CLIENT_ID,
  });
};
