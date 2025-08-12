const axios = require("axios");
const KEY = process.env.GOOGLE_PLACES_API_KEY;
axios.defaults.timeout = 5000;

const PLACES_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

// --- helper to build the photo URL ---
const PHOTO_BASE = "https://maps.googleapis.com/maps/api/place/photo";
function makePhotoUrl(photoReference, maxWidth = 400) {
  const params = new URLSearchParams({
    key: KEY,
    photoreference: photoReference,
    maxwidth: maxWidth.toString(),
  });
  return `${PHOTO_BASE}?${params}`;
}

// Fetch details (includes photos)
async function fetchDetails(place_id) {
  const resp = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        key: KEY,
        place_id,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "formatted_phone_number",
          "opening_hours",
          "website",
          "price_level",
          "rating",
          "user_ratings_total",
          "business_status",
          "permanently_closed",
          "vicinity",
          "photos",
        ].join(","),
      },
    }
  );
  return resp.data.result;
}

async function enrichPlaces(basics) {
  const details = await Promise.all(
    basics.map((b) => fetchDetails(b.place_id))
  );
  return details.map((d) => {
    const firstPhoto = d.photos?.[0];
    const image_url = firstPhoto
      ? makePhotoUrl(firstPhoto.photo_reference, 800)
      : null;

    return {
      place_id: d.place_id,
      name: d.name,
      address: d.formatted_address || d.vicinity,
      location: d.geometry?.location,
      phone: d.formatted_phone_number || null,
      website: d.website || null,
      price_level: d.price_level ?? null,
      rating: d.rating?.toFixed(1) || null, // keep your existing shape
      user_ratings_total: d.user_ratings_total ?? null,
      business_status: d.business_status || null,
      permanently_closed: d.permanently_closed || false,
      opening_hours: d.opening_hours?.weekday_text || [],
      image_url,
    };
  });
}

exports.findByCuisine = async (lat, lon, cuisine) => {
  let resp = await axios.get(PLACES_URL, {
    params: {
      key: KEY,
      location: `${lat},${lon}`,
      radius: 10000,
      type: "restaurant",
      keyword: `${cuisine} restaurant`,
    },
  });

  if (!resp.data.results.length) {
    resp = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          key: KEY,
          query: `${cuisine} restaurant`,
          location: `${lat},${lon}`,
          radius: 10000,
        },
      }
    );
  }

  return enrichPlaces(resp.data.results.slice(0, 30));
};

// NEW: closest restaurants, ranked by distance
exports.findNearby = async (lat, lon, limit = 30) => {
  let resp = await axios.get(PLACES_URL, {
    params: {
      key: KEY,
      location: `${lat},${lon}`,
      rankby: "distance", // <-- distance ranking
      type: "restaurant", // required when using rankby
    },
  });

  let results = resp.data.results || [];

  // Fallback: if Google returns nothing (rare), do a text search in a radius.
  if (!results.length) {
    const fallback = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          key: KEY,
          query: "restaurant",
          location: `${lat},${lon}`,
          radius: 3000,
        },
      }
    );
    results = fallback.data.results || [];
  }

  return enrichPlaces(results.slice(0, limit));
};
