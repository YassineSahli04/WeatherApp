import React from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Cloudy, Moon, CloudSun } from "lucide-react";

interface WeatherIconProps {
  icon: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  "sunny": Sun,
  "partly-cloudy": CloudSun,
  "cloudy": Cloudy,
  "rain": CloudRain,
  "drizzle": CloudDrizzle,
  "snow": CloudSnow,
  "thunder": CloudLightning,
  "night-clear": Moon,
  "default": Cloud,
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ icon, size = 24, className = "" }) => {
  const IconComponent = iconMap[icon] || iconMap["default"];
  return <IconComponent size={size} className={className} />;
};

export default WeatherIcon;
