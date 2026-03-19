export interface WeatherAlertItem {
  type: string;
  message: string;
}

export interface WeatherHourlyItem {
  time: string;
  temp: number;
  icon: string;
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
  hourly: WeatherHourlyItem[];
  sunrise: string;
  sunset: string;
  alerts: WeatherAlertItem[];
}

export const MOCK_WEATHER: WeatherDashboardData = {
  location: "San Francisco, CA",
  coordinates: { lat: 37.7749, lng: -122.4194 },
  current: {
    temp: 18,
    feelsLike: 16,
    condition: "Partly Cloudy",
    description: "Partly cloudy skies with gentle coastal breeze. Expect clearing by late afternoon.",
    icon: "partly-cloudy",
    high: 21,
    low: 13,
    humidity: 72,
    windSpeed: 14,
    windDirection: "NW",
    uvIndex: 5,
    visibility: 16,
    aqi: 42,
    aqiLabel: "Good",
    pressure: 1013,
  },
  hourly: [
    { time: "Now", temp: 18, icon: "partly-cloudy", precip: 5 },
    { time: "1 PM", temp: 19, icon: "partly-cloudy", precip: 5 },
    { time: "2 PM", temp: 20, icon: "sunny", precip: 0 },
    { time: "3 PM", temp: 21, icon: "sunny", precip: 0 },
    { time: "4 PM", temp: 20, icon: "sunny", precip: 0 },
    { time: "5 PM", temp: 19, icon: "partly-cloudy", precip: 10 },
    { time: "6 PM", temp: 18, icon: "partly-cloudy", precip: 15 },
    { time: "7 PM", temp: 17, icon: "cloudy", precip: 20 },
    { time: "8 PM", temp: 16, icon: "cloudy", precip: 25 },
    { time: "9 PM", temp: 15, icon: "night-clear", precip: 10 },
    { time: "10 PM", temp: 14, icon: "night-clear", precip: 5 },
    { time: "11 PM", temp: 14, icon: "night-clear", precip: 5 },
  ],
  sunrise: "6:42 AM",
  sunset: "7:28 PM",
  alerts: [
    {
      type: "Wind Advisory",
      message: "Gusty winds expected near coastal areas from 4 PM to 10 PM. Gusts up to 45 mph possible.",
    },
  ],
};

export const LOCATION_SUGGESTIONS = [
  "San Francisco, CA",
  "New York, NY",
  "London, UK",
  "Tokyo, Japan",
  "Paris, France",
  "Sydney, Australia",
  "Berlin, Germany",
  "Dubai, UAE",
];
