export interface WeatherAlertItem {
  headline: string;
  severity: string;
  urgency: string;
  category: string;
  event: string;
  effective: string;
  expires: string;
  instruction?: string;
}

export interface WeatherDailyItem {
  day: string;
  temp: number;
  precip: number;
}

export interface WeatherDashboardData {
  location: string;
  coordinates: { lat: number; lng: number };
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    description: string;
    icon: string;
    high: number;
    low: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    uvIndex: number;
    visibility: number;
    aqi: number;
    aqiLabel: string;
    pressure: number;
  };
  daily: WeatherDailyItem[];
  sunrise: string;
  sunset: string;
  alert: WeatherAlertItem;
}

export const MOCK_COORDINATES = {
  lat: 37.77,
  lon: -122.42,
};
export const MOCK_LOCATION_LABEL = "San Francisco";
