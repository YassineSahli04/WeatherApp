import type {
  WeatherDashboardData,
  WeatherAlertItem,
  WeatherHourlyItem,
} from "@/data/weatherData";

interface BackendWeatherResponse {
  location?: {
    name?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    localTime?: string;
  };
  current?: {
    temperatureC?: number;
    feelsLikeC?: number;
    condition?: { text?: string; icon?: string };
    humidity?: number;
    windSpeedKph?: number;
    windDirection?: string;
    uvIndex?: number;
    visibilityKm?: number;
    airQuality?: { usEpaIndex?: number; pm2_5?: number };
    feelsLikeExplanation?: string;
  };
  today?: {
    minTempC?: number;
    maxTempC?: number;
    sunrise?: string;
    sunset?: string;
  };
  hourlyForecast?: Array<{
    time?: string;
    temperatureC?: number;
    condition?: { text?: string; icon?: string };
    chanceOfRainPct?: number;
    chanceOfSnowPct?: number;
  }>;
  weatherAlerts?: Array<{
    event?: string;
    headline?: string;
    description?: string;
    severity?: string;
  }>;
}

interface BackendErrorResponse {
  error?: {
    message?: string;
  };
}

export type WeatherApiType = "current" | "forecast" | "alerts";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "Frontend API base URL is not configured. Set VITE_API_BASE_URL.",
    );
  }

  return API_BASE_URL;
}

function mapConditionToIcon(conditionText: string, iconUrl?: string): string {
  const text = conditionText.toLowerCase();
  const isNight = (iconUrl || "").includes("/night/");

  if (text.includes("thunder")) return "thunder";
  if (text.includes("snow") || text.includes("sleet") || text.includes("ice"))
    return "snow";
  if (text.includes("drizzle") || text.includes("mist") || text.includes("fog"))
    return "drizzle";
  if (text.includes("rain") || text.includes("shower")) return "rain";
  if (text.includes("partly") && text.includes("cloud")) return "partly-cloudy";
  if (text.includes("cloud") || text.includes("overcast")) return "cloudy";
  if (text.includes("clear") || text.includes("sunny"))
    return isNight ? "night-clear" : "sunny";
  return isNight ? "night-clear" : "default";
}

function mapAqiLabel(usEpaIndex: number): string {
  switch (usEpaIndex) {
    case 1:
      return "Good";
    case 2:
      return "Moderate";
    case 3:
      return "Unhealthy (Sensitive)";
    case 4:
      return "Unhealthy";
    case 5:
      return "Very Unhealthy";
    case 6:
      return "Hazardous";
    default:
      return "Unknown";
  }
}

function formatHourLabel(dateText: string, isFirst: boolean): string {
  if (isFirst) {
    return "Now";
  }

  const parsed = new Date(dateText.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }

  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
}

function buildLocationTitle(
  payload: BackendWeatherResponse,
  fallbackLocation: string,
): string {
  const parts = [
    payload.location?.name,
    payload.location?.region,
    payload.location?.country,
  ]
    .map((part) => (part || "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : fallbackLocation;
}

function mapHourlyForecast(
  payload: BackendWeatherResponse,
): WeatherHourlyItem[] {
  const hourly = payload.hourlyForecast || [];
  return hourly.slice(0, 12).map((item, index) => {
    const chanceOfRain = Number(item.chanceOfRainPct || 0);
    const chanceOfSnow = Number(item.chanceOfSnowPct || 0);
    const precip = Math.max(chanceOfRain, chanceOfSnow);

    return {
      time: formatHourLabel(item.time || "", index === 0),
      temp: Math.round(Number(item.temperatureC || 0)),
      icon: mapConditionToIcon(
        item.condition?.text || "",
        item.condition?.icon,
      ),
      precip: Math.round(precip),
    };
  });
}

function mapAlerts(payload: BackendWeatherResponse): WeatherAlertItem[] {
  const alerts = payload.weatherAlerts || [];
  return alerts.map((alert) => ({
    type: alert.event || alert.headline || "Weather Alert",
    message: alert.description || alert.severity || "No details available.",
  }));
}

function toDashboardData(
  payload: BackendWeatherResponse,
  fallbackLocation: string,
): WeatherDashboardData {
  const usEpaIndex = Number(payload.current?.airQuality?.usEpaIndex || 0);
  const aqiValue =
    usEpaIndex > 0
      ? usEpaIndex
      : Math.round(Number(payload.current?.airQuality?.pm2_5 || 0));

  return {
    location: buildLocationTitle(payload, fallbackLocation),
    coordinates: {
      lat: Number(payload.location?.latitude || 0),
      lng: Number(payload.location?.longitude || 0),
    },
    current: {
      temp: Math.round(Number(payload.current?.temperatureC || 0)),
      feelsLike: Math.round(Number(payload.current?.feelsLikeC || 0)),
      condition: payload.current?.condition?.text || "Unknown",
      description:
        payload.current?.feelsLikeExplanation ||
        "No additional weather details available.",
      icon: mapConditionToIcon(
        payload.current?.condition?.text || "",
        payload.current?.condition?.icon,
      ),
      high: Math.round(
        Number(payload.today?.maxTempC || payload.current?.temperatureC || 0),
      ),
      low: Math.round(
        Number(payload.today?.minTempC || payload.current?.temperatureC || 0),
      ),
      humidity: Math.round(Number(payload.current?.humidity || 0)),
      windSpeed: Math.round(Number(payload.current?.windSpeedKph || 0)),
      windDirection: payload.current?.windDirection || "-",
      uvIndex: Math.round(Number(payload.current?.uvIndex || 0)),
      visibility: Math.round(Number(payload.current?.visibilityKm || 0)),
      aqi: aqiValue,
      aqiLabel: mapAqiLabel(usEpaIndex),
      pressure: 0,
    },
    hourly: mapHourlyForecast(payload),
    sunrise: payload.today?.sunrise || "-",
    sunset: payload.today?.sunset || "-",
    alerts: mapAlerts(payload),
  };
}

export async function fetchWeatherForLocation(
  location: string,
  type: WeatherApiType,
): Promise<WeatherDashboardData> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/weather?location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`,
  );
  if (!response.ok) {
    const errorPayload = (await response
      .json()
      .catch(() => null)) as BackendErrorResponse | null;
    const message =
      errorPayload?.error?.message || "Failed to fetch weather data.";
    throw new Error(message);
  }

  const payload = (await response.json()) as BackendWeatherResponse;
  return toDashboardData(payload, location);
}
