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
  WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  PGHOST: process.env.PGHOST || "",
  PGPORT: parseNumber(process.env.PGPORT, 5432),
  PGUSER: process.env.PGUSER || "",
  PGPASSWORD: process.env.PGPASSWORD || "",
  PGDATABASE: process.env.PGDATABASE || "",
  WEATHER_FORECAST_MAX_DAYS: parseNumber(process.env.WEATHER_FORECAST_MAX_DAYS),
  FSQ_API_KEY: process.env.FSQ_API_KEY || "",
  FSQ_API_BASE_URL: process.env.FSQ_API_BASE_URL || "",
};

module.exports = {
  env,
};
