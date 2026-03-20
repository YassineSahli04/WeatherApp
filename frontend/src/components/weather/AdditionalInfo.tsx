import React from "react";
import { Sunrise, Sunset, AlertTriangle, Clock } from "lucide-react";
import type { WeatherAlertItem } from "@/data/weatherData";

interface AdditionalInfoProps {
  sunrise: string;
  sunset: string;
  feelsLike: number;
  temp: number;
  windSpeed: number;
  humidity: number;
  alert: WeatherAlertItem;
}

function formatAlertDateTime(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildConciseInstruction(instruction?: string): string | null {
  if (!instruction) return null;
  const normalized = instruction.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [];
  return sentences.slice(0, 3).join(" ").trim();
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({
  sunrise,
  sunset,
  alert,
}) => {
  const startsAt = formatAlertDateTime(alert?.effective);
  const endsAt = formatAlertDateTime(alert?.expires);
  const conciseInstruction = buildConciseInstruction(alert?.instruction);
  const hasAlert = Boolean(
    alert?.event || alert?.headline || alert?.severity || alert?.urgency
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6 w-full animate-fade-in">
      <div className="w-full lg:w-[340px] shrink-0 rounded-[32px] border border-border/50 bg-card p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 text-muted-foreground mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Sunrise className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Sun Cycle</span>
        </div>

        {/* Sunrise */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm font-semibold text-muted-foreground/80 mb-1">Sunrise</div>
            <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{sunrise}</div>
          </div>
          <Sunrise className="h-10 w-10 text-amber-500 stroke-[2]" />
        </div>

        <div className="h-px w-full bg-border/60 my-6" />

        {/* Sunset */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-muted-foreground/80 mb-1">Sunset</div>
            <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{sunset}</div>
          </div>
          <Sunset className="h-10 w-10 text-orange-500 stroke-[2]" />
        </div>
      </div>

      {hasAlert && (
        <div className="flex-1 rounded-[32px] border border-destructive/20 bg-destructive/[0.08] p-6 lg:p-8 shadow-sm">
          {/* Top Row: Title + Badge */}
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <h3 className="text-2xl font-bold text-foreground">
              {alert.event || alert.headline || "Weather Alert"}
            </h3>
            <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive">
              Active Warning
            </span>
          </div>

          {/* Headline */}
          {alert.headline && alert.headline !== alert.event && (
            <p className="text-base font-medium text-destructive mb-4">
              {alert.headline}
            </p>
          )}

          {/* Time Range */}
          {(startsAt || endsAt) && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-6">
              <Clock className="h-4 w-4 text-destructive" />
              <span>{startsAt || "Unknown"} &rarr; {endsAt || "Unknown"}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
            {/* Big warning icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive">
              <AlertTriangle className="h-7 w-7 stroke-[2.5]" />
            </div>
            
            {/* Severity & Urgency labels */}
            <div className="flex flex-wrap items-center gap-6">
              {alert.severity && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  <span className="text-sm font-bold text-foreground">{alert.severity}</span>
                </div>
              )}
              {alert.urgency && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Urgency:</span>
                  <span className="text-sm font-bold text-foreground">{alert.urgency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Instruction Box */}
          {conciseInstruction && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-5">
              <p className="text-sm md:text-base leading-relaxed text-foreground/80 font-medium tracking-wide">
                {conciseInstruction}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdditionalInfo;

