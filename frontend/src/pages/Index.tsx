import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import SearchHeader from "@/components/weather/SearchHeader";
import WeatherHero from "@/components/weather/WeatherHero";
import KeyMetrics from "@/components/weather/KeyMetrics";
import HourlyForecast from "@/components/weather/HourlyForecast";
import WeatherAlert from "@/components/weather/WeatherAlert";
import MapSection from "@/components/weather/MapSection";
import { MOCK_COORDINATES, MOCK_LOCATION_LABEL } from "@/data/weatherData";
import {
  downloadDailyForecastExport,
  fetchWeatherForLocation,
  type DailyExportFormat,
  type DailyDateRangeInput,
} from "@/services/weatherApi";

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

const LoadingPlaceholder = () => (
  <main className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-8 space-y-4 md:space-y-5 max-w-4xl">
    <div className="weather-card weather-hero-gradient rounded-2xl p-6 md:p-8 animate-pulse">
      <div className="h-20 w-40 bg-white/20 rounded-xl mb-3" />
      <div className="h-5 w-48 bg-white/20 rounded-lg mb-2" />
      <div className="h-4 w-56 bg-white/20 rounded-lg" />
    </div>

    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
        Conditions
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="weather-card animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/80" />
              <div className="flex-1">
                <div className="h-3 w-20 bg-secondary/80 rounded mb-2" />
                <div className="h-4 w-24 bg-secondary/80 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="weather-card animate-pulse">
      <div className="h-4 w-32 bg-secondary/80 rounded mb-4" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="w-16 h-24 rounded-xl bg-secondary/80 shrink-0"
          />
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
        Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="weather-card h-36 animate-pulse bg-secondary/40" />
        <div className="weather-card h-36 animate-pulse bg-secondary/40" />
      </div>
    </section>

    <section className="weather-card animate-pulse">
      <div className="h-4 w-24 bg-secondary/80 rounded mb-3" />
      <div className="w-full aspect-[16/9] md:aspect-[2/1] rounded-xl bg-secondary/80" />
    </section>
  </main>
);

const Index = () => {
  const [queryCoordinates, setQueryCoordinates] = useState(MOCK_COORDINATES);
  const [displayLocation, setDisplayLocation] = useState(MOCK_LOCATION_LABEL);
  const [dateRangeDraft, setDateRangeDraft] = useState<DailyDateRangeInput>(() => {
    const today = new Date();
    return {
      start: formatDateForInput(today),
      end: formatDateForInput(addDays(today, 6)),
    };
  });
  const [appliedDateRange, setAppliedDateRange] = useState<DailyDateRangeInput>(
    dateRangeDraft,
  );
  const [downloadFormat, setDownloadFormat] = useState<DailyExportFormat | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "weather",
      queryCoordinates.lat,
      queryCoordinates.lon,
      appliedDateRange.start,
      appliedDateRange.end,
      displayLocation,
    ],
    queryFn: () =>
      fetchWeatherForLocation(
        queryCoordinates.lat,
        queryCoordinates.lon,
        appliedDateRange,
        displayLocation,
      ),
    enabled:
      Number.isFinite(queryCoordinates.lat) &&
      Number.isFinite(queryCoordinates.lon),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const weatherData = data;
  const requestError = error instanceof Error ? error.message : null;
  const isAwaitingResponse = isLoading || isFetching;

  const handleDownload = async (format: DailyExportFormat) => {
    if (!weatherData || downloadFormat) {
      return;
    }

    setDownloadError(null);
    setDownloadFormat(format);
    try {
      await downloadDailyForecastExport({
        lat: queryCoordinates.lat,
        lon: queryCoordinates.lon,
        dateRange: appliedDateRange,
        displayLocation,
        format,
      });
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Unable to export forecast file.",
      );
    } finally {
      setDownloadFormat(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      <SearchHeader
        displayLocation={displayLocation}
        onLocationChange={({ lat, lon, displayLocation: nextDisplayLocation }) => {
          setQueryCoordinates({ lat, lon });
          setDisplayLocation(nextDisplayLocation);
        }}
      />
      <div className="container mx-auto px-4 pt-3 pb-1 max-w-4xl">
        <Link
          to="/locations"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Open Saved Locations Dashboard
        </Link>
      </div>

      {isAwaitingResponse && <LoadingPlaceholder />}

      {!isAwaitingResponse && requestError && (
        <main className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-8 max-w-4xl">
          <div className="weather-card border border-destructive/30 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-1">
              Unable to load weather data
            </p>
            <p className="text-xs text-muted-foreground">{requestError}</p>
          </div>
        </main>
      )}

      {!isAwaitingResponse && weatherData && (
        <main className="container mx-auto px-4 py-4 md:py-6 pb-20 md:pb-8 space-y-4 md:space-y-5 max-w-4xl">
          {/* Hero */}
          <WeatherHero
            temp={weatherData.current.temp}
            feelsLike={weatherData.current.feelsLike}
            condition={weatherData.current.condition}
            description={weatherData.current.description}
            icon={weatherData.current.icon}
            high={weatherData.current.high}
            low={weatherData.current.low}
            sunrise={weatherData.sunrise}
            sunset={weatherData.sunset}
          />

          {/* Weather Alert */}
          <WeatherAlert alert={weatherData.alert} />

          {/* Key Metrics */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
              Conditions
            </h2>
            <KeyMetrics
              high={weatherData.current.high}
              low={weatherData.current.low}
              humidity={weatherData.current.humidity}
              windSpeed={weatherData.current.windSpeed}
              windDirection={weatherData.current.windDirection}
              uvIndex={weatherData.current.uvIndex}
              visibility={weatherData.current.visibility}
              aqi={weatherData.current.aqi}
              aqiLabel={weatherData.current.aqiLabel}
            />
          </section>

          {/* Hourly Forecast */}
          <section>
            <HourlyForecast
              days={weatherData.daily}
              dateRange={dateRangeDraft}
              onDateRangeChange={setDateRangeDraft}
              onApplyDateRange={() => {
                setAppliedDateRange(dateRangeDraft);
              }}
              isLoading={isFetching || Boolean(downloadFormat)}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void handleDownload("csv")}
                disabled={isFetching || Boolean(downloadFormat) || weatherData.daily.length === 0}
                className="h-9 rounded-xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
              >
                {downloadFormat === "csv"
                  ? "Preparing CSV..."
                  : "Download Daily CSV"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownload("json")}
                disabled={isFetching || Boolean(downloadFormat) || weatherData.daily.length === 0}
                className="h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {downloadFormat === "json"
                  ? "Preparing JSON..."
                  : "Download Daily JSON"}
              </button>
            </div>
            {downloadError && (
              <p className="mt-2 text-xs text-destructive">{downloadError}</p>
            )}
          </section>



          {/* Map */}
          <section>
            <MapSection
              location={displayLocation}
              lat={weatherData.coordinates.lat}
              lng={weatherData.coordinates.lng}
            />
          </section>
        </main>
      )}
    </div>
  );
};

export default Index;
