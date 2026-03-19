const { env } = require("../config/env");
const { AppError } = require("../utils/appError");

function parseIsoDate(dateText) {
  return new Date(`${dateText}T00:00:00Z`);
}

function startOfTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function daysBetweenInclusive(startDateText, endDateText) {
  const start = parseIsoDate(startDateText);
  const end = parseIsoDate(endDateText);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

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

function normalizeHourlyForecast(forecastDays, dateRange) {
  const hours = forecastDays.flatMap((day) => day.hour || []);

  const filtered = dateRange
    ? hours.filter((hour) => {
        const datePart = String(hour.time || "").split(" ")[0];
        return datePart >= dateRange.startDate && datePart <= dateRange.endDate;
      })
    : hours.slice(0, 24);

  return filtered.map((hour) => ({
    time: hour.time,
    temperatureC: hour.temp_c,
    feelsLikeC: hour.feelslike_c,
    condition: {
      text: hour.condition?.text || null,
      icon: hour.condition?.icon || null,
    },
    humidity: hour.humidity,
    windSpeedKph: hour.wind_kph,
    windDirection: hour.wind_dir,
    chanceOfRainPct: hour.chance_of_rain,
    chanceOfSnowPct: hour.chance_of_snow,
    precipitationMm: hour.precip_mm,
    uvIndex: hour.uv,
  }));
}

function computePrecipitationProbability(hourlyForecast) {
  if (!hourlyForecast.length) {
    return null;
  }

  return hourlyForecast.reduce((max, hour) => {
    const chance = Math.max(
      Number(hour.chanceOfRainPct || 0),
      Number(hour.chanceOfSnowPct || 0),
    );
    return chance > max ? chance : max;
  }, 0);
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

async function fetchWeatherFromProvider(endpoint, location, dateRange = null) {
  if (!env.WEATHER_API_KEY) {
    throw new AppError(
      "Missing WEATHER_API_KEY. Configure it in backend/.env or docker-compose environment.",
      500,
      "MISSING_WEATHER_API_KEY",
    );
  }

  const days = resolveForecastDays(dateRange);

  const params = new URLSearchParams({
    key: env.WEATHER_API_KEY,
    q: location,
    days: String(days),
    aqi: "yes",
    alerts: "yes",
  });

  const url = `${env.WEATHER_API_BASE_URL}/${endpoint}.json?${params.toString()}`;
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

function transformWeatherResponse(providerData, dateRange = null) {
  const location = providerData.location;
  const current = providerData.current;
  const today = providerData.forecast?.forecastday?.[0] || {};
  const todayDay = today.day || {};
  const astro = today.astro || {};
  const forecastDays = providerData.forecast?.forecastday || [];

  const hourlyForecast = normalizeHourlyForecast(forecastDays, dateRange);
  const alerts = normalizeAlerts(providerData.alerts);
  const precipitationProbabilityPct =
    computePrecipitationProbability(hourlyForecast);

  return {
    location: {
      name: location?.name || null,
      region: location?.region || null,
      country: location?.country || null,
      latitude: location?.lat ?? null,
      longitude: location?.lon ?? null,
      timezone: location?.tz_id || null,
      localTime: location?.localtime || null,
    },
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
    hourlyForecast,
    precipitationProbabilityPct,
    weatherAlerts: alerts,
    meta: {
      dateRange: dateRange || null,
      source: "weatherapi.com",
    },
  };
}

module.exports = {
  fetchWeatherFromProvider,
  transformWeatherResponse,
};
