import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchHeader from "@/components/weather/SearchHeader";
import WeatherHero from "@/components/weather/WeatherHero";
import KeyMetrics from "@/components/weather/KeyMetrics";
import HourlyForecast from "@/components/weather/HourlyForecast";
import AdditionalInfo from "@/components/weather/AdditionalInfo";
import MapSection from "@/components/weather/MapSection";
import { MOCK_LOCATION } from "@/data/weatherData";
import { fetchWeatherForLocation } from "@/services/weatherApi";

const Index = () => {
  const [location, setLocation] = useState(MOCK_LOCATION);
  const weatherType = "forecast";
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["weather", location, weatherType],
    queryFn: () => fetchWeatherForLocation(location, weatherType),
    enabled: location.trim().length > 0,
    retry: 1,
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const weatherData = data;
  const requestError = error instanceof Error ? error.message : null;

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader location={location} onLocationChange={setLocation} />

      <main className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-5 max-w-4xl">
        {(isLoading || isFetching) && (
          <p className="text-xs text-muted-foreground">
            Updating weather data...
          </p>
        )}
        {requestError && (
          <p className="text-xs text-destructive">{requestError}</p>
        )}

        {/* Hero */}
        <WeatherHero
          temp={weatherData.current.temp}
          feelsLike={weatherData.current.feelsLike}
          condition={weatherData.current.condition}
          description={weatherData.current.description}
          icon={weatherData.current.icon}
          high={weatherData.current.high}
          low={weatherData.current.low}
        />

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

        {/* Additional Info */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
            Details
          </h2>
          <AdditionalInfo
            sunrise={weatherData.sunrise}
            sunset={weatherData.sunset}
            feelsLike={weatherData.current.feelsLike}
            temp={weatherData.current.temp}
            windSpeed={weatherData.current.windSpeed}
            humidity={weatherData.current.humidity}
            alerts={weatherData.alerts}
          />
        </section>

        {/* Map */}
        <section>
          <MapSection
            location={location}
            lat={weatherData.coordinates.lat}
            lng={weatherData.coordinates.lng}
          />
        </section>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-muted-foreground">
          Weather data is for demonstration purposes only
        </footer>
      </main>
    </div>
  );
};

export default Index;
