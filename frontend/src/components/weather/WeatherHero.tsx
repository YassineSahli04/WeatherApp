import React from "react";
import WeatherIcon from "./WeatherIcon";

interface WeatherHeroProps {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  high: number;
  low: number;
}

const WeatherHero: React.FC<WeatherHeroProps> = ({ temp, feelsLike, condition, description, icon, high, low }) => {
  return (
    <div className="weather-hero-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden animate-fade-in">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
      <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-primary-foreground/5" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-1">
            <span className="text-7xl md:text-8xl font-light tracking-tighter">{temp}</span>
            <span className="text-2xl md:text-3xl font-light mt-2">°C</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <WeatherIcon icon={icon} size={20} />
            <span className="text-lg font-medium">{condition}</span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm text-primary-foreground/80">
            <span>H: {high}°</span>
            <span>L: {low}°</span>
            <span className="border-l border-primary-foreground/30 pl-3">Feels like {feelsLike}°</span>
          </div>
        </div>

        <div className="md:max-w-[240px]">
          <WeatherIcon icon={icon} size={80} className="text-primary-foreground/30 mb-2 hidden md:block" />
          <p className="text-sm text-primary-foreground/75 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherHero;
