const express = require("express");
const {
  lookupByCuisine,
  lookupNearby, // NEW
} = require("../controllers/restaurantController");

const router = express.Router();

// Existing: cuisine-based suggestions
router.get("/restaurants", lookupByCuisine);

// NEW: closest restaurants to a lat/lon (ranked by distance)
router.get("/restaurants/nearby", lookupNearby);

module.exports = { restaurantsRouter: router };
