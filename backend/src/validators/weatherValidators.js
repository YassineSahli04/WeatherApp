const { AppError } = require("../utils/appError");

const US_ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;
const UK_POSTCODE_REGEX = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
const UK_POSTCODE_OUTWARD_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?$/i;
const CANADA_POSTAL_REGEX =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ][ -]?\d[ABCEGHJ-NPRSTVWXYZ]\d$/i;
const CANADA_POSTAL_FSA_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]$/i;
const CITY_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .,'-]{1,119}$/;

const ALLOWED_API_ENDPOINTS = new Set(["current", "forecast", "alerts"]);

function normalizeCoordinateLocation(location) {
  const coordinateMatch = location.match(
    /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
  );

  if (!coordinateMatch) {
    return null;
  }

  const latitude = Number.parseFloat(coordinateMatch[1]);
  const longitude = Number.parseFloat(coordinateMatch[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new AppError(
      "Latitude/longitude out of range. Latitude must be -90..90 and longitude -180..180.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return `${latitude},${longitude}`;
}

function validateLocation(rawLocation) {
  const location = typeof rawLocation === "string" ? rawLocation.trim() : "";

  if (!location) {
    throw new AppError("`location` is required.", 400, "VALIDATION_ERROR");
  }

  if (location.length > 120) {
    throw new AppError(
      "`location` must be 120 characters or fewer.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const coordinateLocation = normalizeCoordinateLocation(location);
  if (coordinateLocation) {
    return coordinateLocation;
  }

  if (US_ZIP_REGEX.test(location)) {
    return location;
  }

  if (
    UK_POSTCODE_REGEX.test(location) ||
    UK_POSTCODE_OUTWARD_REGEX.test(location)
  ) {
    return location.toUpperCase().replace(/\s+/g, " ").trim();
  }

  if (
    CANADA_POSTAL_REGEX.test(location) ||
    CANADA_POSTAL_FSA_REGEX.test(location)
  ) {
    return location.toUpperCase().replace(/\s+/g, "");
  }

  const cityLocation = location.replace(/\s+/g, " ").trim();
  if (CITY_NAME_REGEX.test(cityLocation)) {
    return cityLocation;
  }

  throw new AppError(
    "`location` must be one of: lat,lon (e.g. 48.8567,2.3508), city name (e.g. Paris), US ZIP (10001), UK postcode (SW1), or Canada postal code (G2J).",
    400,
    "VALIDATION_ERROR",
  );
}

function parseDate(rawDate, fieldName) {
  if (!rawDate) {
    return null;
  }

  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoPattern.test(rawDate)) {
    throw new AppError(
      `\`${fieldName}\` must use YYYY-MM-DD format.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  const parsed = new Date(`${rawDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(
      `\`${fieldName}\` is not a valid date.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return rawDate;
}

function normalizeDateRange(input) {
  if (!input) {
    return null;
  }

  const startDate = parseDate(input.start, "dateRange.start");
  const endDate = parseDate(input.end, "dateRange.end");

  if (!startDate || !endDate) {
    throw new AppError(
      "`dateRange.start` and `dateRange.end` are both required.",
      400,
      "VALIDATION_ERROR",
    );
  }

  if (new Date(startDate) > new Date(endDate)) {
    throw new AppError(
      "`dateRange.start` must be before or equal to `dateRange.end`.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return { startDate, endDate };
}

function validateRecordId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(
      "`id` must be a positive integer.",
      400,
      "VALIDATION_ERROR",
    );
  }
  return id;
}

function validateApiEndpoint(rawEndpoint) {
  if (
    rawEndpoint === undefined ||
    rawEndpoint === null ||
    String(rawEndpoint).trim() === ""
  ) {
    throw new AppError("`endpoint` must be defined.", 400, "VALIDATION_ERROR");
  }

  if (typeof rawEndpoint !== "string") {
    throw new AppError("`endpoint` must be a string.", 400, "VALIDATION_ERROR");
  }

  const endpoint = rawEndpoint
    .trim()
    .toLowerCase()
    .replace(/\.json$/i, "");

  if (!ALLOWED_API_ENDPOINTS.has(endpoint)) {
    throw new AppError(
      "`endpoint` is invalid. Allowed values: current, forecast, alerts.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return endpoint;
}

module.exports = {
  validateLocation,
  normalizeDateRange,
  validateRecordId,
  validateApiEndpoint,
};
