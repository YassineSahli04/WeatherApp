import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchHeader from "@/components/weather/SearchHeader";
import WeatherHero from "@/components/weather/WeatherHero";
import KeyMetrics from "@/components/weather/KeyMetrics";
import HourlyForecast from "@/components/weather/HourlyForecast";
import WeatherAlert from "@/components/weather/WeatherAlert";
import MapSection from "@/components/weather/MapSection";
import { MOCK_LOCATION } from "@/data/weatherData";
import { fetchWeatherForLocation } from "@/services/weatherApi";

const LoadingPlaceholder = () => (
  <main className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-5 max-w-4xl">
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
  const [location, setLocation] = useState(MOCK_LOCATION);
  const weatherType = "forecast";
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["weather", location, weatherType],
    queryFn: () => fetchWeatherForLocation(location, weatherType),
    enabled: location.trim().length > 0,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const weatherData = data;
  const requestError = error instanceof Error ? error.message : null;
  const isAwaitingResponse = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader location={location} onLocationChange={setLocation} />

      {isAwaitingResponse && <LoadingPlaceholder />}

      {!isAwaitingResponse && requestError && (
        <main className="container mx-auto px-4 py-4 md:py-6 max-w-4xl">
          <div className="weather-card border border-destructive/30 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-1">
              Unable to load weather data
            </p>
            <p className="text-xs text-muted-foreground">{requestError}</p>
          </div>
        </main>
      )}

      {!isAwaitingResponse && weatherData && (
        <main className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-5 max-w-4xl">
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
            <HourlyForecast hours={weatherData.hourly} />
          </section>



          {/* Map */}
          <section>
            <MapSection
              location={location}
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
