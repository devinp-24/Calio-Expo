const { findByCuisine, findNearby } = require("../services/googleService");

// GET /api/restaurants?lat=..&lon=..&cuisine=italian
exports.lookupByCuisine = async (req, res) => {
  try {
    const { lat, lon, cuisine } = req.query;
    if (!lat || !lon || !cuisine) {
      return res
        .status(400)
        .json({ error: "lat, lon, and cuisine are required" });
    }
    const list = await findByCuisine(lat, lon, cuisine);
    res.json(list);
  } catch (err) {
    console.error("lookupByCuisine error:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
};

// GET /api/restaurants/nearby?lat=..&lon=..&max=30
exports.lookupNearby = async (req, res) => {
  try {
    const { lat, lon, max } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }
    const limit = Math.max(1, Math.min(Number(max) || 30, 50));
    const list = await findNearby(lat, lon, limit);
    res.json(list);
  } catch (err) {
    console.error("lookupNearby error:", err);
    res.status(500).json({ error: "Failed to fetch nearby restaurants" });
  }
};
