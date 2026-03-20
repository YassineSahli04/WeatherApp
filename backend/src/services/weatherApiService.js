const { env } = require("../config/env");
const { AppError } = require("../utils/appError");
const {
  parseIsoDate,
  startOfTodayUtc,
  daysBetweenInclusive,
} = require("../utils/dateUtils");

const API_ENDPOINTS = Object.freeze({
  FORECAST: "forecast",
  HISTORY: "history",
});

function resolveForecastDays(dateRange) {
  if (!dateRange) {
    return 2;
  }

  const today = startOfTodayUtc();
  const startDate = parseIsoDate(dateRange.startDate);
  if (startDate < today) {
    throw new AppError(
      "Date range must start today or in the future for forecast requests.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const days = daysBetweenInclusive(dateRange.startDate, dateRange.endDate);
  if (days < 1 || days > env.WEATHER_FORECAST_MAX_DAYS) {
    throw new AppError(
      `Date range exceeds the supported forecast window (1-${env.WEATHER_FORECAST_MAX_DAYS} days).`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return days;
}

function resolveHistoryDateRange(dateRange) {
  const startDate = String(dateRange?.startDate || "");
  const endDate = String(dateRange?.endDate || "");
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(startDate) || !isoDatePattern.test(endDate)) {
    throw new AppError(
      "History date range must use YYYY-MM-DD format.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(
      "History date range contains an invalid date.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const minSupportedDate = parseIsoDate("2010-01-01");
  if (start < minSupportedDate || end < minSupportedDate) {
    throw new AppError(
      "History date range must be on or after 2010-01-01.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const today = startOfTodayUtc();
  if (start > today || end > today) {
    throw new AppError(
      "History date range must not be later than today.",
      400,
      "VALIDATION_ERROR",
    );
  }

  if (start > end) {
    throw new AppError(
      "History date range start must be before or equal to end.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return { startDate, endDate };
}

function buildFeelsLikeExplanation(current) {
  const temp = current.temp_c;
  const feelsLike = current.feelslike_c;
  const heatIndex = current.heatindex_c;
  const windChill = current.windchill_c;

  if (
    Number.isFinite(heatIndex) &&
    heatIndex > temp &&
    feelsLike >= heatIndex - 0.2
  ) {
    return `Heat index effect: feels like ${feelsLike}°C vs actual ${temp}°C.`;
  }

  if (
    Number.isFinite(windChill) &&
    windChill < temp &&
    feelsLike <= windChill + 0.2
  ) {
    return `Wind chill effect: feels like ${feelsLike}°C vs actual ${temp}°C.`;
  }

  return `Feels like ${feelsLike}°C with no strong heat-index or wind-chill effect.`;
}

function normalizeAlerts(alertsPayload) {
  const rawAlerts = alertsPayload?.alert || [];
  return rawAlerts.map((alert) => ({
    headline: alert.headline || null,
    severity: alert.severity || null,
    urgency: alert.urgency || null,
    category: alert.category || null,
    event: alert.event || null,
    effective: alert.effective || null,
    expires: alert.expires || null,
    description: alert.desc || null,
    instruction: alert.instruction || null,
  }));
}

function normalizeForecast(forecastDays, dateRange) {
  const days = dateRange
    ? forecastDays.filter((day) => {
        const datePart = String(day.date || "");
        return datePart >= dateRange.startDate && datePart <= dateRange.endDate;
      })
    : forecastDays;

  return {
    forecastday: days.map((day) => ({
      day: day?.date,
      avgtemp_c: day?.day?.avgtemp_c ?? null,
      daily_rain_probability_pct:
        day?.day?.daily_chance_of_rain ??
        (day?.day?.daily_will_it_rain ? 100 : 0),
    })),
  };
}

async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 12000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: options.headers || {},
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);
    return { response, body };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError(
        "Weather provider timed out.",
        500,
        "WEATHER_API_TIMEOUT",
      );
    }
    throw new AppError(
      "Unable to reach weather provider.",
      500,
      "WEATHER_API_NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWeatherFromProvider(api, location, dateRange = null) {
  if (!env.WEATHER_API_KEY) {
    throw new AppError(
      "Missing WEATHER_API_KEY. Configure it in backend/.env or docker-compose environment.",
      500,
      "MISSING_WEATHER_API_KEY",
    );
  }
  let paramObj = {
    key: env.WEATHER_API_KEY,
    q: location,
    aqi: "yes",
    alerts: "yes",
  };

  if (api === API_ENDPOINTS.FORECAST) {
    const days = resolveForecastDays(dateRange);
    paramObj = { ...paramObj, days: String(days) };
  } else if (api === API_ENDPOINTS.HISTORY) {
    const historyDateRange = resolveHistoryDateRange(dateRange);
    paramObj = {
      ...paramObj,
      dt: historyDateRange.startDate,
      end_dt: historyDateRange.endDate,
    };
  }

  const params = new URLSearchParams(paramObj);

  const url = `${env.WEATHER_API_BASE_URL}/${api}.json?${params.toString()}`;
  const { response, body } = await fetchJson(url);

  if (!response.ok) {
    if (response.status === 400) {
      const message = body?.error?.message || "Invalid location.";
      throw new AppError(message, 400, "INVALID_LOCATION");
    }
    if (response.status === 404) {
      throw new AppError(
        "Weather data not found for this location.",
        404,
        "WEATHER_NOT_FOUND",
      );
    }
    throw new AppError(
      "Weather provider returned an unexpected error.",
      500,
      "WEATHER_API_ERROR",
    );
  }

  return body;
}

function transformCurrentWeatherResponse(providerData) {
  const current = providerData.current;
  const today = providerData.forecast?.forecastday?.[0] || {};
  const todayDay = today.day || {};
  const astro = today.astro || {};
  const alerts = normalizeAlerts(providerData.alerts);

  return {
    current: {
      temperatureC: current?.temp_c ?? null,
      feelsLikeC: current?.feelslike_c ?? null,
      condition: {
        text: current?.condition?.text || null,
        icon: current?.condition?.icon || null,
      },
      humidity: current?.humidity ?? null,
      windSpeedKph: current?.wind_kph ?? null,
      windDirection: current?.wind_dir ?? null,
      uvIndex: current?.uv ?? null,
      visibilityKm: current?.vis_km ?? null,
      airQuality: current?.air_quality
        ? {
            usEpaIndex: current.air_quality["us-epa-index"] ?? null,
            gbDefraIndex: current.air_quality["gb-defra-index"] ?? null,
            pm2_5: current.air_quality.pm2_5 ?? null,
            pm10: current.air_quality.pm10 ?? null,
            o3: current.air_quality.o3 ?? null,
            no2: current.air_quality.no2 ?? null,
          }
        : null,
      feelsLikeExplanation: current ? buildFeelsLikeExplanation(current) : null,
    },
    today: {
      minTempC: todayDay.mintemp_c ?? null,
      maxTempC: todayDay.maxtemp_c ?? null,
      sunrise: astro.sunrise || null,
      sunset: astro.sunset || null,
    },
    weatherAlerts: alerts,
  };
}

function transformDailyWeatherResponse(providerData, dateRange) {
  const forecastDays = providerData.forecast?.forecastday || [];
  return normalizeForecast(forecastDays, dateRange);
}

module.exports = {
  fetchWeatherFromProvider,
  transformCurrentWeatherResponse,
  transformDailyWeatherResponse,
  API_ENDPOINTS,
};
