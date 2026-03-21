const { env } = require("../config/env");
const { AppError } = require("../utils/appError");

const PLACES_API_VERSION = "2025-06-17";

function normalizePlacesResults(results) {
  return results.map((place) => ({
    name: place?.name || null,
    location: {
      address: place?.location?.address || null,
      locality: place?.location?.locality || null,
      region: place?.location?.region || null,
      country: place?.location?.country || null,
      formatted_address: place?.location?.formatted_address || null,
    },
    website: place?.website || null,
  }));
}

async function getCurrentLocationFamousPlaces(apiLocation) {
  const params = new URLSearchParams({
    ll: apiLocation,
    radius: "5000",
    sort: "RELEVANCE",
    limit: "8",
  });

  const url = `${env.FSQ_API_BASE_URL}/places/search?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: env.FSQ_API_KEY,
      "X-Places-Api-Version": PLACES_API_VERSION,
      accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      "Unable to fetch relevant places.";

    throw new AppError(
      errorMessage,
      500,
      "PLACES_API_ERROR",
    );
  }

  return normalizePlacesResults(payload?.results || []);
}

module.exports = {
  getCurrentLocationFamousPlaces,
};
