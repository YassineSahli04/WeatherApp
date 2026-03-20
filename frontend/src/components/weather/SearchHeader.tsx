import React, { useEffect, useRef, useState } from "react";
import { Search, MapPin, Navigation, X } from "lucide-react";
import { Map as MapboxMap, Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface SearchHeaderProps {
  displayLocation: string;
  onLocationChange: (selection: {
    lat: number;
    lon: number;
    displayLocation: string;
  }) => void;
}

interface MapboxContext {
  id?: string;
  text?: string;
  short_code?: string;
}

interface RawMapboxFeature {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  place_type?: string[];
  context?: MapboxContext[];
}

interface GeocodeSuggestion {
  id: string;
  displayName: string;
  label: string;
  context?: string;
  lat: number;
  lng: number;
}

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || "").trim();

function isValidToken(token: string): boolean {
  return Boolean(token && token !== "your_mapbox_token_here");
}

function parseCoordinateQuery(
  value: string,
): { lat: number; lng: number } | null {
  const match = value.match(
    /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
  );
  if (!match) {
    return null;
  }

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function getFeatureCenter(
  feature: RawMapboxFeature,
): { lat: number; lng: number } | null {
  const center = feature.center || [NaN, NaN];
  const lng = Number(center[0]);
  const lat = Number(center[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function getContextValue(
  feature: RawMapboxFeature,
  prefixes: string[],
): string | null {
  const context = feature.context || [];
  for (const item of context) {
    const id = item.id || "";
    if (prefixes.some((prefix) => id.startsWith(prefix))) {
      const value = (item.text || "").trim();
      if (value) {
        return value;
      }
    }
  }
  return null;
}

function getCityName(feature: RawMapboxFeature): string | null {
  const placeTypes = feature.place_type || [];
  if (placeTypes.includes("place")) {
    return (feature.text || "").trim() || null;
  }

  return (
    getContextValue(feature, ["place."]) ||
    getContextValue(feature, ["locality."]) ||
    getContextValue(feature, ["district."]) ||
    null
  );
}

function getCountryCode(feature: RawMapboxFeature): string | null {
  const context = feature.context || [];
  const country = context.find((item) => (item.id || "").startsWith("country."));
  const code = (country?.short_code || "").trim().toLowerCase();
  return code || null;
}

async function fetchMapboxFeatures(
  query: string,
  options?: {
    signal?: AbortSignal;
    limit?: number;
    types?: string;
    autocomplete?: boolean;
    proximity?: { lat: number; lng: number } | null;
    countryCode?: string | null;
  },
): Promise<RawMapboxFeature[]> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set(
    "types",
    options?.types || "address,postcode,place,locality,neighborhood",
  );
  url.searchParams.set("limit", String(options?.limit || 8));
  url.searchParams.set(
    "autocomplete",
    options?.autocomplete === false ? "false" : "true",
  );
  url.searchParams.set("access_token", MAPBOX_TOKEN);

  if (options?.proximity) {
    url.searchParams.set(
      "proximity",
      `${options.proximity.lng},${options.proximity.lat}`,
    );
  }

  if (options?.countryCode) {
    url.searchParams.set("country", options.countryCode);
  }

  const response = await fetch(url.toString(), { signal: options?.signal });
  if (!response.ok) {
    throw new Error("Unable to search locations right now.");
  }

  const payload = (await response.json()) as {
    features?: RawMapboxFeature[];
  };
  return payload.features || [];
}

function mapPlaceFeatureToCitySuggestion(
  feature: RawMapboxFeature,
): GeocodeSuggestion | null {
  const placeTypes = feature.place_type || [];
  if (!placeTypes.includes("place")) {
    return null;
  }

  const center = getFeatureCenter(feature);
  if (!center) {
    return null;
  }

  const displayName =
    getCityName(feature) || feature.text || feature.place_name || "Unknown city";
  const fullPlace = (feature.place_name || "").trim();
  const context = fullPlace.startsWith(`${displayName},`)
    ? fullPlace.slice(displayName.length + 1).trim()
    : "";

  return {
    id: feature.id || `${center.lat},${center.lng}`,
    displayName,
    label: fullPlace || displayName,
    context: context || undefined,
    lat: center.lat,
    lng: center.lng,
  };
}

async function fetchCityByName(
  cityName: string,
  options?: {
    signal?: AbortSignal;
    proximity?: { lat: number; lng: number } | null;
    countryCode?: string | null;
  },
): Promise<GeocodeSuggestion | null> {
  const features = await fetchMapboxFeatures(cityName, {
    signal: options?.signal,
    limit: 1,
    types: "place",
    autocomplete: false,
    proximity: options?.proximity || null,
    countryCode: options?.countryCode || null,
  });

  const cityFeature = features[0];
  if (!cityFeature) {
    return null;
  }
  return mapPlaceFeatureToCitySuggestion(cityFeature);
}

async function fetchCitySuggestionsFromAnyInput(
  query: string,
  limit: number,
  options?: {
    signal?: AbortSignal;
    autocomplete?: boolean;
  },
): Promise<GeocodeSuggestion[]> {
  const features = await fetchMapboxFeatures(query, {
    signal: options?.signal,
    limit: Math.max(limit * 3, 8),
    types: "address,postcode,place,locality,neighborhood",
    autocomplete: options?.autocomplete,
  });

  const directCitySuggestions: GeocodeSuggestion[] = [];
  const citySeeds = new Map<
    string,
    { cityName: string; proximity: { lat: number; lng: number } | null; countryCode: string | null }
  >();

  for (const feature of features) {
    const directCity = mapPlaceFeatureToCitySuggestion(feature);
    if (directCity) {
      directCitySuggestions.push(directCity);
      continue;
    }

    const cityName = getCityName(feature);
    if (!cityName) {
      continue;
    }

    const countryCode = getCountryCode(feature);
    const proximity = getFeatureCenter(feature);
    const key = `${cityName.toLowerCase()}|${countryCode || ""}`;
    if (!citySeeds.has(key)) {
      citySeeds.set(key, { cityName, proximity, countryCode });
    }
  }

  const resolvedCities = await Promise.all(
    Array.from(citySeeds.values()).map((seed) =>
      fetchCityByName(seed.cityName, {
        signal: options?.signal,
        proximity: seed.proximity,
        countryCode: seed.countryCode,
      }),
    ),
  );

  const combined = [...directCitySuggestions, ...resolvedCities.filter(Boolean)];
  const deduped = new Map<string, GeocodeSuggestion>();
  for (const city of combined) {
    const key = city.label.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, city);
    }
  }

  return Array.from(deduped.values()).slice(0, limit);
}

async function reverseGeocodeNearestCity(
  lat: number,
  lng: number,
): Promise<GeocodeSuggestion | null> {
  const cities = await fetchCitySuggestionsFromAnyInput(`${lng},${lat}`, 1, {
    autocomplete: false,
  });
  return cities[0] || null;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  });
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  displayLocation,
  onLocationChange,
}) => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [showCoords, setShowCoords] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applySuggestion = (selection: GeocodeSuggestion) => {
    onLocationChange({
      lat: selection.lat,
      lon: selection.lng,
      displayLocation: selection.displayName,
    });
    setQuery("");
    setFocused(false);
    setSuggestions([]);
    setError("");
  };

  const handleSuggestionClick = (suggestion: GeocodeSuggestion) => {
    applySuggestion(suggestion);
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please enter an address, zip, or city.");
      return;
    }

    if (!isValidToken(MAPBOX_TOKEN)) {
      setError("Mapbox token missing. Set VITE_MAPBOX_TOKEN to search locations.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const coordinateQuery = parseCoordinateQuery(trimmed);
      if (coordinateQuery) {
        const coordinateCity = await reverseGeocodeNearestCity(
          coordinateQuery.lat,
          coordinateQuery.lng,
        );
        if (!coordinateCity) {
          setError("No city found for these coordinates.");
          return;
        }
        applySuggestion(coordinateCity);
        return;
      }

      const best =
        suggestions[0] || (await fetchCitySuggestionsFromAnyInput(trimmed, 1))[0];
      if (!best) {
        setError("No city found for this search. Try another query.");
        return;
      }

      applySuggestion(best);
    } catch (searchError) {
      const message =
        searchError instanceof Error
          ? searchError.message
          : "Unable to search locations right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGPS = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    if (!isValidToken(MAPBOX_TOKEN)) {
      setError("Mapbox token missing. Set VITE_MAPBOX_TOKEN to use GPS.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const position = await getCurrentPosition();
      const city = await reverseGeocodeNearestCity(
        position.coords.latitude,
        position.coords.longitude,
      );

      if (!city) {
        setError("Unable to resolve your location to a city.");
        return;
      }

      applySuggestion(city);
    } catch {
      setError("Unable to get your current location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoordsSubmit = async () => {
    const latNum = Number.parseFloat(lat);
    const lngNum = Number.parseFloat(lng);

    if (
      Number.isNaN(latNum) ||
      Number.isNaN(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      setError("Invalid coordinates. Latitude: -90..90, Longitude: -180..180.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const displayLat = latNum.toFixed(4);
      const displayLng = Math.abs(lngNum).toFixed(4);
      const displayDir = lngNum < 0 ? "W" : "E";

      onLocationChange({
        lat: latNum,
        lon: lngNum,
        displayLocation: `${displayLat}°N, ${displayLng}°${displayDir}`,
      });
      
      setShowCoords(false);
      setLat("");
      setLng("");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current
          .closest(".search-container")
          ?.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!focused || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (!isValidToken(MAPBOX_TOKEN)) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const next = await fetchCitySuggestionsFromAnyInput(trimmed, 5, {
          signal: controller.signal,
        });
        setSuggestions(next);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, focused]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h1 className="truncate text-sm font-semibold text-foreground">
            {displayLocation}
          </h1>
        </div>

        <div className="search-container relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError("");
              }}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSearch();
                }
              }}
              placeholder="Search address, zip, city, or coordinates..."
              className="h-10 w-full rounded-xl border border-border/50 bg-secondary/60 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              disabled={isSubmitting}
            />

            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setError("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {focused && (query.trim().length >= 2 || isSearching) && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-fade-in">
                {isSearching && (
                  <div className="px-4 py-2.5 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}

                {!isSearching &&
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-secondary/60"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {suggestion.displayName}
                        </span>
                        {suggestion.context && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {suggestion.context}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}

                {!isSearching && suggestions.length === 0 && (
                  <div className="px-4 py-2.5 text-sm text-muted-foreground">
                    No cities found for this input.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => void handleGPS()}
            title="Use current location"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            disabled={isSubmitting}
          >
            <Navigation className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowCoords(!showCoords)}
            title="Enter coordinates"
            className="h-10 w-10 shrink-0 rounded-xl bg-secondary text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
            disabled={isSubmitting}
          >
            GPS
          </button>

          {showCoords && (
            <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] max-w-none sm:w-[500px] md:w-[600px] z-50 animate-fade-in space-y-4 p-4 lg:p-5 bg-card rounded-2xl border border-border/50 shadow-xl origin-top-right">
              <h3 className="text-sm font-semibold text-foreground">Pin Location on Map</h3>
              <div className="relative w-full h-[280px] rounded-xl overflow-hidden bg-secondary border border-border/50">
               {isValidToken(MAPBOX_TOKEN) ? (
                 <MapboxMap
                   initialViewState={{
                     longitude: Number(lng) || 0,
                     latitude: Number(lat) || 20,
                     zoom: 1.5
                   }}
                   mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                   mapboxAccessToken={MAPBOX_TOKEN}
                   onClick={(e) => {
                     setLat(e.lngLat.lat.toFixed(6));
                     setLng(e.lngLat.lng.toFixed(6));
                   }}
                   cursor="crosshair"
                 >
                   <NavigationControl position="bottom-right" showCompass={false} />
                   {(lat && lng) ? (
                     <Marker 
                        longitude={Number(lng)} 
                        latitude={Number(lat)} 
                        anchor="bottom"
                        draggable
                        onDragEnd={(e) => {
                          setLat(e.lngLat.lat.toFixed(6));
                          setLng(e.lngLat.lng.toFixed(6));
                        }}
                     >
                        <div className="relative flex flex-col items-center">
                          <MapPin className="w-8 h-8 text-primary fill-primary-foreground/20 drop-shadow-md" />
                        </div>
                     </Marker>
                   ) : null}
                 </MapboxMap>
               ) : (
                 <div className="w-full h-full flex items-center justify-center p-4 text-center">
                    <p className="text-sm text-muted-foreground">Mapbox token missing. Add VITE_MAPBOX_TOKEN in .env to enable the interactive map.</p>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className="h-10 flex-1 rounded-xl border border-border/50 bg-secondary/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className="h-10 flex-1 rounded-xl border border-border/50 bg-secondary/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => void handleCoordsSubmit()}
                className="h-10 rounded-xl bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
              >
                Launch
              </button>
            </div>
            
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest text-center mt-1">
              Direct API query without city check
            </p>
          </div>
        )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-destructive animate-fade-in">
            {error}
          </p>
        )}
      </div>
    </header>
  );
};

export default SearchHeader;
