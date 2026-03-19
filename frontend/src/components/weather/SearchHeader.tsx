import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Navigation, X } from "lucide-react";
import { LOCATION_SUGGESTIONS } from "@/data/weatherData";

interface SearchHeaderProps {
  location: string;
  onLocationChange: (location: string) => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ location, onLocationChange }) => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [showCoords, setShowCoords] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length > 0
    ? LOCATION_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSearch = () => {
    if (!query.trim()) {
      setError("Please enter a location");
      return;
    }
    setError("");
    onLocationChange(query.trim());
    setQuery("");
    setFocused(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onLocationChange(suggestion);
    setQuery("");
    setFocused(false);
    setError("");
  };

  const handleGPS = () => {
    onLocationChange("Current Location");
    setError("");
  };

  const handleCoordsSubmit = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setError("Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180");
      return;
    }
    setError("");
    onLocationChange(`${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`);
    setShowCoords(false);
    setLat("");
    setLng("");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.search-container')?.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto py-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground truncate">{location}</h1>
        </div>

        <div className="search-container relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search city, zip code, or landmark..."
              className="w-full h-10 pl-10 pr-10 bg-secondary/60 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {query && (
              <button onClick={() => { setQuery(""); setError(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}

            {focused && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-40 animate-fade-in">
                {filtered.map(s => (
                  <button key={s} onClick={() => handleSuggestionClick(s)} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleGPS} title="Use current location" className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            <Navigation className="w-4 h-4" />
          </button>

          <button onClick={() => setShowCoords(!showCoords)} title="Enter coordinates" className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0 text-xs font-bold">
            GPS
          </button>
        </div>

        {showCoords && (
          <div className="mt-2 flex items-center gap-2 animate-fade-in">
            <input
              type="number"
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="Latitude"
              className="flex-1 h-9 px-3 bg-secondary/60 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="number"
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder="Longitude"
              className="flex-1 h-9 px-3 bg-secondary/60 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={handleCoordsSubmit} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Go
            </button>
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-xs text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    </header>
  );
};

export default SearchHeader;
