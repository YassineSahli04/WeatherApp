const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseNumber(process.env.PORT, 5000),
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || "",
  WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL || "https://api.weatherapi.com/v1",
  MAP_API_BASE_URL: process.env.MAP_API_BASE_URL || "https://nominatim.openstreetmap.org",
  DATABASE_URL: process.env.DATABASE_URL || "",
  PGHOST: process.env.PGHOST || "localhost",
  PGPORT: parseNumber(process.env.PGPORT, 5432),
  PGUSER: process.env.PGUSER || "postgres",
  PGPASSWORD: process.env.PGPASSWORD || "postgres",
  PGDATABASE: process.env.PGDATABASE || "WeatherDb",
  WEATHER_FORECAST_MAX_DAYS: parseNumber(process.env.WEATHER_FORECAST_MAX_DAYS, 14),
};

module.exports = {
  env,
};
