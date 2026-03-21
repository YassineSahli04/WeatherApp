import type {
  WeatherDashboardData,
  WeatherAlertItem,
  WeatherDailyItem,
} from "@/data/weatherData";

interface BackendCurrentWeatherResponse {
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
  weatherAlerts?: Array<{
    headline?: string;
    severity?: string;
    urgency?: string;
    category?: string;
    event?: string;
    effective?: string;
    expires?: string;
    description?: string;
    instruction?: string;
  }>;
}

interface BackendDailyWeatherResponse {
  forecast?: {
    forecastday?: Array<{
      day?: string;
      avgtemp_c?: number;
      daily_rain_probability_pct?: number;
    }>;
  };
}

interface BackendErrorResponse {
  error?: {
    message?: string;
  };
}

interface BackendWeatherHistoryRecord {
  id?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  dateRange?: {
    start?: string;
    end?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyDateRangeInput {
  start: string;
  end: string;
}

export type DailyExportFormat = "csv" | "json";

export interface LocationDashboardItem {
  id: number | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

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

function mapAlerts(
  payload: BackendCurrentWeatherResponse,
): WeatherAlertItem {
  const alerts = payload.weatherAlerts || [];
  const primaryAlert = alerts[0] || {};
  const headline = (primaryAlert.headline || "").trim();
  const event = (primaryAlert.event || "").trim();
  const severity = (primaryAlert.severity || "").trim();
  const urgency = (primaryAlert.urgency || "").trim();
  const category = (primaryAlert.category || "").trim();
  const effective = (primaryAlert.effective || "").trim();
  const expires = (primaryAlert.expires || "").trim();
  const instruction = (primaryAlert.instruction || "").trim();

  return {
    headline,
    severity,
    urgency,
    category,
    event,
    effective,
    expires,
    instruction: instruction || undefined,
  };
}

function mapDailyForecast(
  payload: BackendDailyWeatherResponse,
): WeatherDailyItem[] {
  const days = payload.forecast?.forecastday || [];
  return days.map((item) => ({
    day: item.day || "",
    temp: Math.round(Number(item.avgtemp_c || 0)),
    precip: Math.round(Number(item.daily_rain_probability_pct || 0)),
  }));
}

async function parseErrorMessage(response: Response): Promise<string> {
  const errorPayload = (await response
    .json()
    .catch(() => null)) as BackendErrorResponse | null;
  return errorPayload?.error?.message || "Failed to fetch weather data.";
}

function getFilenameFromContentDisposition(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/filename="([^"]+)"/i);
  return match?.[1] || null;
}

async function fetchCurrentWeatherForLocation(
  lat: number,
  lon: number,
): Promise<BackendCurrentWeatherResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as BackendCurrentWeatherResponse;
}

async function fetchDailyWeatherForLocation(
  lat: number,
  lon: number,
  dateRange: DailyDateRangeInput,
  displayLocation: string,
): Promise<BackendDailyWeatherResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayLocation,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as BackendDailyWeatherResponse;
}

export async function fetchWeatherForLocation(
  lat: number,
  lon: number,
  dateRange: DailyDateRangeInput,
  displayLocation: string,
): Promise<WeatherDashboardData> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitude/longitude must be valid decimal numbers.");
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error(
      "Latitude must be between -90 and 90, and longitude between -180 and 180.",
    );
  }

  const [currentPayload, dailyPayload] = await Promise.all([
    fetchCurrentWeatherForLocation(lat, lon),
    fetchDailyWeatherForLocation(lat, lon, dateRange, displayLocation),
  ]);

  const usEpaIndex = Number(currentPayload.current?.airQuality?.usEpaIndex || 0);
  const aqiValue =
    usEpaIndex > 0
      ? usEpaIndex
      : Math.round(Number(currentPayload.current?.airQuality?.pm2_5 || 0));

  return {
    location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    coordinates: { lat, lng: lon },
    current: {
      temp: Math.round(Number(currentPayload.current?.temperatureC || 0)),
      feelsLike: Math.round(Number(currentPayload.current?.feelsLikeC || 0)),
      condition: currentPayload.current?.condition?.text || "Unknown",
      description:
        currentPayload.current?.feelsLikeExplanation ||
        "No additional weather details available.",
      icon: mapConditionToIcon(
        currentPayload.current?.condition?.text || "",
        currentPayload.current?.condition?.icon,
      ),
      high: Math.round(
        Number(
          currentPayload.today?.maxTempC ||
            currentPayload.current?.temperatureC ||
            0,
        ),
      ),
      low: Math.round(
        Number(
          currentPayload.today?.minTempC ||
            currentPayload.current?.temperatureC ||
            0,
        ),
      ),
      humidity: Math.round(Number(currentPayload.current?.humidity || 0)),
      windSpeed: Math.round(Number(currentPayload.current?.windSpeedKph || 0)),
      windDirection: currentPayload.current?.windDirection || "-",
      uvIndex: Math.round(Number(currentPayload.current?.uvIndex || 0)),
      visibility: Math.round(Number(currentPayload.current?.visibilityKm || 0)),
      aqi: aqiValue,
      aqiLabel: mapAqiLabel(usEpaIndex),
      pressure: 0,
    },
    daily: mapDailyForecast(dailyPayload),
    sunrise: currentPayload.today?.sunrise || "-",
    sunset: currentPayload.today?.sunset || "-",
    alert: mapAlerts(currentPayload),
  };
}

export async function fetchLocationDashboardData(): Promise<
  LocationDashboardItem[]
> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/weather/history`);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as BackendWeatherHistoryRecord[];
  return payload.map((item) => ({
    id:
      typeof item.id === "number" && Number.isInteger(item.id) ? item.id : null,
    location: (item.location || "").trim(),
    latitude:
      typeof item.latitude === "number" && Number.isFinite(item.latitude)
        ? item.latitude
        : null,
    longitude:
      typeof item.longitude === "number" && Number.isFinite(item.longitude)
        ? item.longitude
        : null,
    startDate: item.dateRange?.start || null,
    endDate: item.dateRange?.end || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  }));
}

export async function downloadDailyForecastExport(params: {
  lat: number;
  lon: number;
  dateRange: DailyDateRangeInput;
  displayLocation: string;
  format: DailyExportFormat;
}): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/weather/export/daily?lat=${encodeURIComponent(String(params.lat))}&lon=${encodeURIComponent(String(params.lon))}&format=${encodeURIComponent(params.format)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayLocation: params.displayLocation,
        dateRange: {
          start: params.dateRange.start,
          end: params.dateRange.end,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition");
  const fallbackName = `daily-forecast.${params.format}`;
  const filename = getFilenameFromContentDisposition(contentDisposition) || fallbackName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function deleteWeatherRecordById(id: number): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/weather/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}
