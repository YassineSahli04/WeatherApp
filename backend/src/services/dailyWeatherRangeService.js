const { env } = require("../config/env");
const { AppError } = require("../utils/appError");

function startOfTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function parseIsoDate(dateText) {
  return new Date(`${dateText}T00:00:00Z`);
}

function formatIsoDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minusDaysUtc(date, days) {
  return new Date(date.getTime() - days * 86400000);
}

function validateDailyDateRange(dateRange) {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    throw new AppError(
      "`dateRange.start` and `dateRange.end` are required.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const start = parseIsoDate(dateRange.startDate);
  const end = parseIsoDate(dateRange.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("Invalid date range.", 400, "VALIDATION_ERROR");
  }

  const minHistoryDate = parseIsoDate("2010-01-01");
  if (start < minHistoryDate || end < minHistoryDate) {
    throw new AppError(
      "Date range must be on or after 2010-01-01.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const today = startOfTodayUtc();
  const maxForecastDate = new Date(
    today.getTime() + (env.WEATHER_FORECAST_MAX_DAYS - 1) * 86400000,
  );
  if (end > maxForecastDate) {
    throw new AppError(
      `Date range end exceeds forecast limit (max ${env.WEATHER_FORECAST_MAX_DAYS} days from today).`,
      400,
      "VALIDATION_ERROR",
    );
  }
}

function splitDateRangeForDailyApis(dateRange) {
  const today = startOfTodayUtc();
  const start = parseIsoDate(dateRange.startDate);
  const end = parseIsoDate(dateRange.endDate);

  let historyRange = null;
  let forecastRange = null;

  if (end < today) {
    historyRange = dateRange;
  } else if (start >= today) {
    forecastRange = dateRange;
  } else {
    historyRange = {
      startDate: dateRange.startDate,
      endDate: formatIsoDate(minusDaysUtc(today, 1)),
    };
    forecastRange = {
      startDate: formatIsoDate(today),
      endDate: dateRange.endDate,
    };
  }

  return { historyRange, forecastRange };
}

function mergeDailyForecast(historyPayload, forecastPayload) {
  const mergedByDay = new Map();
  const historyDays = historyPayload?.forecast?.forecastday || [];
  const forecastDays = forecastPayload?.forecast?.forecastday || [];

  for (const day of [...historyDays, ...forecastDays]) {
    if (day?.day) {
      mergedByDay.set(day.day, day);
    }
  }

  return Array.from(mergedByDay.values()).sort((a, b) =>
    String(a.day || "").localeCompare(String(b.day || "")),
  );
}

module.exports = {
  validateDailyDateRange,
  splitDateRangeForDailyApis,
  mergeDailyForecast,
};
