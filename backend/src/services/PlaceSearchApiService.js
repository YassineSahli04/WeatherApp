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
    limit: "5",
  });

  const url = `${env.FSQ_API_BASE_URL}/places/search?${params.toString()}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.FSQ_API_KEY}`,
        "X-Places-Api-Version": PLACES_API_VERSION,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new AppError(
      "Unable to reach places provider.",
      502,
      "PLACES_API_NETWORK_ERROR",
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      "Unable to fetch relevant places.";

    throw new AppError(errorMessage, 500, "PLACES_API_ERROR");
  }

  return normalizePlacesResults(payload?.results || []);
}

module.exports = {
  getCurrentLocationFamousPlaces,
};
