import React, { useState, useEffect } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  FullscreenControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapSectionProps {
  location: string;
  lat: number;
  lng: number;
}

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapSection: React.FC<MapSectionProps> = ({ location, lat, lng }) => {
  const [hasToken, setHasToken] = useState<boolean>(!!TOKEN && TOKEN !== "your_mapbox_token_here");
  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom: 11
  });

  // Update view state when lat/lng props change
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
    }));
  }, [lat, lng]);

  return (
    <div className="weather-card animate-fade-in overflow-hidden rounded-[32px] p-6 shadow-sm border border-border/40">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 mb-5">Map View</h3>
      
      <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden bg-secondary/30 ring-1 ring-border border border-white/10 shadow-inner group">
        
        {hasToken ? (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/navigation-night-v1"
            mapboxAccessToken={TOKEN}
            style={{ width: "100%", height: "100%" }}
          >
            <FullscreenControl position="top-right" />
            <NavigationControl position="bottom-right" showCompass={false} />
            
            <Marker longitude={lng} latitude={lat} anchor="bottom">
              <div className="relative flex flex-col items-center animate-bounce-short">
                {/* Custom Marker */}
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-md animate-pulse" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-xl border-2 border-background z-10">
                  <MapPin className="w-5 h-5 text-primary-foreground fill-primary-foreground/20" />
                </div>
                <div className="w-2 h-2 bg-primary rounded-full mt-1 opacity-80" />
                <div className="w-6 h-1 bg-black/30 rounded-full mt-1 blur-[2px]" />
              </div>
            </Marker>
          </Map>
        ) : (
          /* Fallback when no token is provided */
          <div className="absolute inset-0 bg-secondary flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-2">Mapbox Token Required</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              To display the interactive map, you need to add your Mapbox Access Token to the environment variables.
            </p>
            <div className="bg-background/80 backdrop-blur border border-border/50 rounded-lg px-4 py-3 text-left">
              <code className="text-xs text-primary font-mono block mb-1">.env</code>
              <code className="text-xs text-foreground font-mono">VITE_MAPBOX_TOKEN=pk.eyJ1...</code>
            </div>
            
            {/* Coordinates label even without map */}
            <div className="mt-8 text-xs font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {lat.toFixed(4)}°N, {Math.abs(lng).toFixed(4)}°{lng < 0 ? "W" : "E"}
            </div>
          </div>
        )}

        {/* Floating Location label inside the map (only if map is active) */}
        {hasToken && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md rounded-xl px-4 py-2 text-sm font-semibold text-foreground border border-border/50 shadow-lg flex items-center gap-2 transition-opacity duration-300 opacity-90 group-hover:opacity-100 z-10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {location}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSection;
