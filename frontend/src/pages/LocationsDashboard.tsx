import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, Clock3 } from "lucide-react";
import {
  fetchLocationDashboardData,
  type LocationDashboardItem,
} from "@/services/weatherApi";

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCoordinate(value: number | null): string {
  if (value === null) {
    return "-";
  }
  return value.toFixed(4);
}

const MobileLocationCard = ({ item }: { item: LocationDashboardItem }) => (
  <article className="weather-card">
    <div className="mb-3 flex items-center gap-2">
      <MapPin className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">
        {item.location || "Unknown location"}
      </h2>
    </div>

    <div className="space-y-2 text-xs text-muted-foreground">
      <p>
        <span className="font-medium text-foreground">Latitude:</span>{" "}
        {formatCoordinate(item.latitude)}
      </p>
      <p>
        <span className="font-medium text-foreground">Longitude:</span>{" "}
        {formatCoordinate(item.longitude)}
      </p>
      <p>
        <span className="font-medium text-foreground">Start date:</span>{" "}
        {formatDate(item.startDate)}
      </p>
      <p>
        <span className="font-medium text-foreground">End date:</span>{" "}
        {formatDate(item.endDate)}
      </p>
      <p>
        <span className="font-medium text-foreground">Created:</span>{" "}
        {formatDateTime(item.createdAt)}
      </p>
      <p>
        <span className="font-medium text-foreground">Updated:</span>{" "}
        {formatDateTime(item.updatedAt)}
      </p>
    </div>
  </article>
);

const LocationsDashboard = () => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["weather-location-dashboard"],
    queryFn: fetchLocationDashboardData,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const rows = data || [];
  const requestError = error instanceof Error ? error.message : null;
  const isBusy = isLoading || isFetching;

  return (
    <main className="min-h-dvh bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-4 md:py-6 space-y-4">
        <header className="weather-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Saved Locations Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Weather data are not displayed.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to Weather
            </Link>
          </div>
        </header>

        {isBusy && (
          <section className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="weather-card h-24 animate-pulse bg-secondary/40"
              />
            ))}
          </section>
        )}

        {!isBusy && requestError && (
          <section className="weather-card border border-destructive/30 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-1">
              Unable to load location dashboard
            </p>
            <p className="text-xs text-muted-foreground">{requestError}</p>
          </section>
        )}

        {!isBusy && !requestError && rows.length === 0 && (
          <section className="weather-card text-sm text-muted-foreground">
            No stored location records found yet.
          </section>
        )}

        {!isBusy && !requestError && rows.length > 0 && (
          <>
            <section className="grid grid-cols-1 gap-3 md:hidden">
              {rows.map((item, index) => (
                <MobileLocationCard
                  key={`${item.location}-${index}`}
                  item={item}
                />
              ))}
            </section>

            <section className="hidden md:block weather-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/60">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Latitude</th>
                      <th className="px-4 py-3 font-semibold">Longitude</th>
                      <th className="px-4 py-3 font-semibold">Start Date</th>
                      <th className="px-4 py-3 font-semibold">End Date</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-4 py-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, index) => (
                      <tr
                        key={`${item.location}-${index}`}
                        className="border-t border-border/60"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.location || "Unknown location"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatCoordinate(item.latitude)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatCoordinate(item.longitude)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(item.startDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(item.endDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(item.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="weather-card bg-secondary/35 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Date range and timestamps are shown in your browser locale.
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              Records refresh automatically when this page is reloaded.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default LocationsDashboard;
