import React from "react";
import {
  Thermometer, Droplets, Wind, Sun, Eye, Gauge
} from "lucide-react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color }) => (
  <div className="weather-card flex items-center gap-3 animate-fade-in">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  </div>
);

interface KeyMetricsProps {
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  visibility: number;
  aqi: number;
  aqiLabel: string;
}

const KeyMetrics: React.FC<KeyMetricsProps> = ({
  high, low, humidity, windSpeed, windDirection, uvIndex, visibility, aqi, aqiLabel,
}) => {
  const metrics: MetricCardProps[] = [
    {
      icon: <Thermometer className="w-5 h-5 text-weather-sunset" />,
      label: "Min / Max",
      value: `${low}° / ${high}°`,
      color: "bg-weather-sunset/10",
    },
    {
      icon: <Droplets className="w-5 h-5 text-weather-humidity" />,
      label: "Humidity",
      value: `${humidity}%`,
      color: "bg-weather-humidity/10",
    },
    {
      icon: <Wind className="w-5 h-5 text-weather-wind" />,
      label: "Wind",
      value: `${windSpeed} km/h ${windDirection}`,
      color: "bg-weather-wind/10",
    },
    {
      icon: <Sun className="w-5 h-5 text-weather-uv" />,
      label: "UV Index",
      value: `${uvIndex} — ${uvIndex <= 2 ? "Low" : uvIndex <= 5 ? "Moderate" : uvIndex <= 7 ? "High" : "Very High"}`,
      color: "bg-weather-uv/10",
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      label: "Visibility",
      value: `${visibility} km`,
      color: "bg-primary/10",
    },
    {
      icon: <Gauge className="w-5 h-5 text-weather-aqi-good" />,
      label: "Air Quality",
      value: `${aqi} — ${aqiLabel}`,
      color: "bg-weather-aqi-good/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {metrics.map((m, i) => (
        <div key={m.label} style={{ animationDelay: `${i * 50}ms` }}>
          <MetricCard {...m} />
        </div>
      ))}
    </div>
  );
};

export default KeyMetrics;
