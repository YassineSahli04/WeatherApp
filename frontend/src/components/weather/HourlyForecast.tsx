import React from "react";
import { Droplets, MoveHorizontal } from "lucide-react";

interface DailyItem {
  day: string;
  temp: number;
  precip: number;
}

interface DateRangeValue {
  start: string;
  end: string;
}

interface HourlyForecastProps {
  days: DailyItem[];
  dateRange: DateRangeValue;
  onDateRangeChange: (nextRange: DateRangeValue) => void;
  onApplyDateRange: () => void;
  isLoading?: boolean;
}

function formatDayLabel(dayText: string): string {
  const parsed = new Date(`${dayText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dayText;
  }

  return parsed.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({
  days,
  dateRange,
  onDateRangeChange,
  onApplyDateRange,
  isLoading = false,
}) => {
  const minDate = "2010-01-01";
  const maxDate = formatDateForInput(addDays(new Date(), 9));

  const hasInvalidRange =
    Boolean(dateRange.start) &&
    Boolean(dateRange.end) &&
    dateRange.start > dateRange.end;
  const hasOutOfBoundsRange =
    (Boolean(dateRange.start) &&
      (dateRange.start < minDate || dateRange.start > maxDate)) ||
    (Boolean(dateRange.end) &&
      (dateRange.end < minDate || dateRange.end > maxDate));

  return (
    <div className="weather-card animate-fade-in">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Daily Forecast
        </h3>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Forecast values are estimates and may differ from current conditions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="date"
            value={dateRange.start}
            min={minDate}
            max={maxDate}
            onChange={(event) =>
              onDateRangeChange({
                ...dateRange,
                start: event.target.value,
              })
            }
            className="h-10 rounded-xl border border-border/50 bg-secondary/60 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="date"
            value={dateRange.end}
            min={minDate}
            max={maxDate}
            onChange={(event) =>
              onDateRangeChange({
                ...dateRange,
                end: event.target.value,
              })
            }
            className="h-10 rounded-xl border border-border/50 bg-secondary/60 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={onApplyDateRange}
            disabled={isLoading || hasInvalidRange || hasOutOfBoundsRange}
            className="h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Apply Range"}
          </button>
        </div>
        {hasInvalidRange && (
          <p className="mt-2 text-xs text-destructive">
            End date must be after or equal to start date.
          </p>
        )}
        {hasOutOfBoundsRange && (
          <p className="mt-2 text-xs text-destructive">
            Date range must be between {minDate} and {maxDate}.
          </p>
        )}
      </div>

      {days.length > 3 && (
        <div className="mb-2 flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Swipe to see more days</span>
        </div>
      )}

      <div className="relative">
        {days.length > 3 && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent z-10" />
          </>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1 -mx-1 px-1">
          {days.map((dayItem, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl min-w-[110px] shrink-0 transition-colors ${
                i === 0 ? "bg-primary/10" : "hover:bg-secondary/60"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  i === 0 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {formatDayLabel(dayItem.day)}
              </span>
              <span className="text-lg font-semibold text-foreground">
                {dayItem.temp}°C
              </span>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-weather-humidity" />
                <span className="text-xs text-weather-humidity font-medium">
                  {dayItem.precip}%
                </span>
              </div>
            </div>
          ))}
          {days.length === 0 && (
            <div className="text-sm text-muted-foreground px-2 py-3">
              No daily forecast data for this range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyForecast;
