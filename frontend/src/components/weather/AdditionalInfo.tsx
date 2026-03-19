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

interface ParsedAlertSections {
  WHAT?: string;
  WHERE?: string;
  WHEN?: string;
  IMPACTS?: string;
  "ADDITIONAL DETAILS"?: string;
}

function cleanAlertText(value: string): string {
  return value.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function parseAlertSections(message: string): ParsedAlertSections | null {
  const normalized = message.replace(/\r/g, "").trim();
  if (!normalized.includes("*")) {
    return null;
  }

  const markerRegex = /\*\s*([A-Z][A-Z ]+)\.\.\.\s*/g;
  const markers = Array.from(normalized.matchAll(markerRegex));
  if (!markers.length) {
    return null;
  }

  const sections: ParsedAlertSections = {};

  for (let i = 0; i < markers.length; i += 1) {
    const match = markers[i];
    const nextMatch = markers[i + 1];
    const key = match[1].trim() as keyof ParsedAlertSections;
    const start = (match.index || 0) + match[0].length;
    const end = nextMatch?.index ?? normalized.length;
    const value = cleanAlertText(normalized.slice(start, end));

    if (value) {
      sections[key] = value;
    }
  }

  return Object.keys(sections).length ? sections : null;
}

function toImpactItems(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
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
                  {(() => {
                    const parsed = parseAlertSections(alert.message);
                    if (!parsed) {
                      return (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                          {alert.message}
                        </p>
                      );
                    }

                    const impactItems = parsed.IMPACTS ? toImpactItems(parsed.IMPACTS) : [];

                    return (
                      <div className="mt-1.5 space-y-2">
                        {parsed.WHAT && (
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            <span className="font-semibold">What: </span>
                            {parsed.WHAT}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {parsed.WHERE && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground">
                              <span className="font-semibold">Where:</span> {parsed.WHERE}
                            </span>
                          )}
                          {parsed.WHEN && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground">
                              <span className="font-semibold">When:</span> {parsed.WHEN}
                            </span>
                          )}
                        </div>

                        {impactItems.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-foreground mb-1">Impacts</p>
                            <ul className="space-y-1">
                              {impactItems.map((item) => (
                                <li key={item} className="text-xs text-muted-foreground leading-relaxed">
                                  - {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {parsed["ADDITIONAL DETAILS"] && (
                          <details className="group">
                            <summary className="text-[11px] font-semibold text-foreground cursor-pointer">
                              Additional details
                            </summary>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {parsed["ADDITIONAL DETAILS"]}
                            </p>
                          </details>
                        )}
                      </div>
                    );
                  })()}
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
