const { AppError } = require("../utils/appError");
const { buildCsv } = require("../utils/csv");
const {
  validateLocation,
  normalizeDateRange,
  validateRecordId,
  validateLatLonQuery,
} = require("../validators/weatherValidators");
const {
  fetchWeatherFromProvider,
  transformCurrentWeatherResponse,
  transformDailyWeatherResponse,
  API_ENDPOINTS,
} = require("../services/weatherApiService");
const {
  validateDailyDateRange,
  splitDateRangeForDailyApis,
  mergeDailyForecast,
} = require("../services/dailyWeatherRangeService");
const {
  createWeatherRecord,
  getWeatherRecordById,
  getWeatherHistory,
  updateWeatherRecord,
  deleteWeatherRecord,
} = require("../services/weatherStorageService");

async function buildWeatherPayload(
  api,
  location,
  dateRange = null,
  isCurrentWeather = true,
) {
  const providerData = await fetchWeatherFromProvider(api, location, dateRange);

  let payload;
  if (isCurrentWeather) {
    payload = transformCurrentWeatherResponse(providerData, dateRange);
  } else {
    payload = {
      forecast: transformDailyWeatherResponse(providerData, dateRange),
    };
  }

  return payload;
}

async function buildMergedDailyForecastPayload(location, dateRange) {
  validateDailyDateRange(dateRange);
  const { historyRange, forecastRange } = splitDateRangeForDailyApis(dateRange);

  const [historyPayload, forecastPayload] = await Promise.all([
    historyRange
      ? buildWeatherPayload(
          API_ENDPOINTS.HISTORY,
          location,
          historyRange,
          false,
        )
      : Promise.resolve(null),
    forecastRange
      ? buildWeatherPayload(
          API_ENDPOINTS.FORECAST,
          location,
          forecastRange,
          false,
        )
      : Promise.resolve(null),
  ]);

  const basePayload = forecastPayload || historyPayload;
  if (!basePayload) {
    throw new AppError(
      "Unable to resolve weather data range.",
      500,
      "INTERNAL",
    );
  }

  return {
    forecast: {
      forecastday: mergeDailyForecast(historyPayload, forecastPayload),
    },
  };
}

async function getCurrentWeatherConditions(req, res) {
  const { lat, lon } = validateLatLonQuery(req.query.lat, req.query.lon);
  const location = `${lat},${lon}`;
  const api = API_ENDPOINTS.FORECAST;
  const weather = await buildWeatherPayload(api, location, null, true);
  res.status(200).json(weather);
}

async function getDailyWeatherData(req, res) {
  const { lat, lon } = validateLatLonQuery(req.query.lat, req.query.lon);
  const location = `${lat},${lon}`;
  const dateRange = normalizeDateRange(req.body.dateRange);
  const weather = await buildMergedDailyForecastPayload(location, dateRange);
  res.status(200).json(weather);
}

async function getOrCreateWeather(req, res) {
  const { lat, lon } = validateLatLonQuery(req.query.lat, req.query.lon);
  const location = `${lat},${lon}`;
  const dateRange = normalizeDateRange(req.body.dateRange);
  const weather = dateRange
    ? await buildMergedDailyForecastPayload(location, dateRange)
    : await buildWeatherPayload(API_ENDPOINTS.FORECAST, location, null, true);

  const record = await createWeatherRecord({
    location,
    latitude: weather.location?.latitude ?? lat,
    longitude: weather.location?.longitude ?? lon,
    dateRange,
    weatherData: weather,
  });

  res.status(201).json(record);
}

async function getWeatherHistoryController(req, res) {
  const records = await getWeatherHistory();
  res.status(200).json(records);
}

async function updateWeather(req, res) {
  const id = validateRecordId(req.params.id);
  const existing = await getWeatherRecordById(id);

  if (!existing) {
    throw new AppError("Weather record not found.", 404, "NOT_FOUND");
  }

  const nextLocation = req.body.location
    ? validateLocation(req.body.location)
    : existing.location;
  const nextDateRange = req.body.dateRange
    ? normalizeDateRange(req.body.dateRange)
    : existing.dateRange
      ? { startDate: existing.dateRange.start, endDate: existing.dateRange.end }
      : null;

  const weather = nextDateRange
    ? await buildMergedDailyForecastPayload(nextLocation, nextDateRange)
    : await buildWeatherPayload(
        API_ENDPOINTS.FORECAST,
        nextLocation,
        null,
        true,
      );
  const updated = await updateWeatherRecord(id, {
    location: nextLocation,
    latitude: weather.location?.latitude ?? existing.latitude,
    longitude: weather.location?.longitude ?? existing.longitude,
    dateRange: nextDateRange,
    weatherData: weather,
  });

  res.status(200).json(updated);
}

async function deleteWeather(req, res) {
  const id = validateRecordId(req.params.id);
  const deleted = await deleteWeatherRecord(id);
  if (!deleted) {
    throw new AppError("Weather record not found.", 404, "NOT_FOUND");
  }

  res.status(200).json({ message: "Weather record deleted successfully." });
}

async function exportWeather(req, res) {
  const format = String(req.query.format || "json").toLowerCase();
  const records = await getWeatherHistory();

  if (format === "json") {
    return res.status(200).json(records);
  }

  if (format !== "csv") {
    throw new AppError(
      "Unsupported export format. Use `json` or `csv`.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const csv = buildCsv(records, [
    { header: "id", value: "id" },
    { header: "location", value: "location" },
    { header: "latitude", value: "latitude" },
    { header: "longitude", value: "longitude" },
    { header: "start_date", value: (row) => row.dateRange?.start || "" },
    { header: "end_date", value: (row) => row.dateRange?.end || "" },
    { header: "created_at", value: "createdAt" },
    { header: "weather_data", value: (row) => JSON.stringify(row.weatherData) },
  ]);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="weather-history.csv"',
  );
  return res.status(200).send(csv);
}

module.exports = {
  getWeather: getCurrentWeatherConditions,
  getDailyWeatherData,
  createWeather: getOrCreateWeather,
  getWeatherHistoryController,
  updateWeather,
  deleteWeather,
  exportWeather,
  __testing: {
    API_ENDPOINTS,
    buildWeatherPayload,
  },
};
