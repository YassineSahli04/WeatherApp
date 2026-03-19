import React from "react";
import WeatherIcon from "./WeatherIcon";
import { Droplets } from "lucide-react";

interface HourlyItem {
  time: string;
  temp: number;
  icon: string;
  precip: number;
}

interface HourlyForecastProps {
  hours: HourlyItem[];
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({ hours }) => {
  return (
    <div className="weather-card animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-3">Hourly Forecast</h3>
      <div className="flex gap-1 overflow-x-auto scrollbar-hidden pb-1 -mx-1 px-1">
        {hours.map((h, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl min-w-[64px] shrink-0 transition-colors ${
              i === 0 ? "bg-primary/10" : "hover:bg-secondary/60"
            }`}
          >
            <span className={`text-xs font-medium ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
              {h.time}
            </span>
            <WeatherIcon icon={h.icon} size={20} className={i === 0 ? "text-primary" : "text-foreground"} />
            <span className="text-sm font-semibold text-foreground">{h.temp}°</span>
            {h.precip > 0 && (
              <div className="flex items-center gap-0.5">
                <Droplets className="w-3 h-3 text-weather-humidity" />
                <span className="text-[10px] text-weather-humidity font-medium">{h.precip}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HourlyForecast;
