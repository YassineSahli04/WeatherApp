import React, { useState } from "react";
import { AlertTriangle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { WeatherAlertItem } from "@/data/weatherData";

interface WeatherAlertProps {
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

const WeatherAlert: React.FC<WeatherAlertProps> = ({ alert }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasAlert = Boolean(
    alert?.event || alert?.headline || alert?.severity || alert?.urgency
  );

  if (!hasAlert) return null;

  const startsAt = formatAlertDateTime(alert?.effective);
  const endsAt = formatAlertDateTime(alert?.expires);
  const conciseInstruction = buildConciseInstruction(alert?.instruction);

  return (
    <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/[0.04] shadow-sm overflow-hidden animate-fade-in transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-destructive/[0.06] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="text-left flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <h3 className="text-base md:text-lg font-bold text-foreground">
              {alert.event || alert.headline || "Weather Alert"}
            </h3>
            <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive self-start md:self-auto">
              Active Warning
            </span>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/50 text-muted-foreground shadow-sm border border-border/40 shrink-0 group-hover:bg-background">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="p-4 md:p-6 pt-0 md:pt-2 border-t border-destructive/10">
          {alert.headline && alert.headline !== alert.event && (
            <p className="text-sm md:text-base font-medium text-destructive mb-4 tracking-wide leading-relaxed">
              {alert.headline}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            {(startsAt || endsAt) && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border/40 w-fit">
                <Clock className="h-4 w-4 text-destructive/80" />
                <span>{startsAt || "Unknown"} &rarr; {endsAt || "Unknown"}</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {alert.severity && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</span>
                  <span className="text-sm font-bold text-foreground bg-background/50 px-2 py-0.5 rounded border border-border/40">{alert.severity}</span>
                </div>
              )}
              {alert.urgency && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Urgency</span>
                  <span className="text-sm font-bold text-foreground bg-background/50 px-2 py-0.5 rounded border border-border/40">{alert.urgency}</span>
                </div>
              )}
            </div>
          </div>

          {conciseInstruction && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-4 md:p-5 mt-2">
              <p className="text-sm md:text-base leading-relaxed text-foreground/85 font-medium tracking-wide">
                {conciseInstruction}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherAlert;
