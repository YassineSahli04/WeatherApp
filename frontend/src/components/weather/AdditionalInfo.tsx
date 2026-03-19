import React from "react";
import { Sunrise, Sunset, Thermometer, AlertTriangle } from "lucide-react";

interface AdditionalInfoProps {
  sunrise: string;
  sunset: string;
  feelsLike: number;
  temp: number;
  windSpeed: number;
  humidity: number;
  alerts: { type: string; message: string }[];
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({
  sunrise, sunset, feelsLike, temp, windSpeed, humidity, alerts,
}) => {
  const feelsExplanation = feelsLike < temp
    ? `Wind chill makes it feel cooler. Wind at ${windSpeed} km/h lowers the perceived temperature.`
    : feelsLike > temp
    ? `High humidity (${humidity}%) makes it feel warmer than the actual temperature.`
    : "The perceived temperature matches the actual temperature.";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Sunrise / Sunset */}
      <div className="weather-card animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground mb-3">Sun Cycle</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-weather-sunrise/10 flex items-center justify-center">
              <Sunrise className="w-4.5 h-4.5 text-weather-sunrise" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sunrise</p>
              <p className="text-sm font-semibold text-foreground">{sunrise}</p>
            </div>
          </div>

          {/* Simple sun arc */}
          <div className="flex-1 mx-4 relative h-8">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
            <div className="absolute bottom-0 left-[10%] right-[10%] h-8 border-t-2 border-dashed border-weather-sunrise/30 rounded-t-full" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-weather-sunset/10 flex items-center justify-center">
              <Sunset className="w-4.5 h-4.5 text-weather-sunset" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sunset</p>
              <p className="text-sm font-semibold text-foreground">{sunset}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feels Like Explanation */}
      <div className="weather-card animate-fade-in">
        <h3 className="text-sm font-semibold text-foreground mb-3">Feels Like</h3>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Thermometer className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{feelsLike}°C</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feelsExplanation}</p>
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="md:col-span-2 animate-fade-in">
          {alerts.map((alert, i) => (
            <div key={i} className="weather-card border border-weather-alert/30 bg-weather-alert/5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-weather-alert/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-weather-alert" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{alert.type}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdditionalInfo;
