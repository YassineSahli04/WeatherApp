const { env } = require("../config/env");

async function fetchLocationMetadata(latitude, longitude) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return null;
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
  });

  const url = `${env.MAP_API_BASE_URL}/reverse?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "WeatherAppBackend/1.0 (contact: admin@example.com)",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const address = payload.address || {};

    return {
      displayName: payload.display_name || null,
      mapUrl: payload.osm_type && payload.osm_id ? `https://www.openstreetmap.org/${payload.osm_type}/${payload.osm_id}` : null,
      countryCode: address.country_code || null,
      country: address.country || null,
      state: address.state || null,
      city: address.city || address.town || address.village || null,
      postcode: address.postcode || null,
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  fetchLocationMetadata,
};
