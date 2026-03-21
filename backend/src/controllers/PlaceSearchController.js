const { validateLatLonQuery } = require("../validators/weatherValidators");
const {
  getCurrentLocationFamousPlaces,
} = require("../services/PlaceSearchApiService");

async function getRelevantPlaces(req, res) {
  const { lat, lon } = validateLatLonQuery(req.query.lat, req.query.lon);
  const location = `${lat},${lon}`;
  const results = await getCurrentLocationFamousPlaces(location);

  res.status(200).json({ results });
}

module.exports = {
  getRelevantPlaces,
};
