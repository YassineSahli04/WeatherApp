import React from "react";
import { MapPin } from "lucide-react";

interface MapSectionProps {
  location: string;
  lat: number;
  lng: number;
}

const MapSection: React.FC<MapSectionProps> = ({ location, lat, lng }) => {
  return (
    <div className="weather-card animate-fade-in overflow-hidden">
      <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
      <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-xl overflow-hidden bg-secondary">
        {/* Static map image from OpenStreetMap tiles */}
        <img
          src={`https://static-maps.yandex.ru/v1?lang=en_US&ll=${lng},${lat}&z=11&size=650,300&l=map`}
          alt={`Map of ${location}`}
          className="w-full h-full object-cover opacity-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Fallback styled map */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary to-primary/10">
          {/* Grid lines to simulate map */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />

          {/* Roads simulation */}
          <div className="absolute top-1/3 left-0 right-0 h-px bg-muted-foreground/20" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-muted-foreground/15" />
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-muted-foreground/15" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-muted-foreground/20" />

          {/* Pin marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="w-2 h-2 bg-primary rounded-full mt-0.5 opacity-50" />
            <div className="w-6 h-1.5 bg-foreground/10 rounded-full mt-0.5 blur-sm" />
          </div>
        </div>

        {/* Coordinates label */}
        <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-muted-foreground border border-border/50">
          {lat.toFixed(4)}°N, {Math.abs(lng).toFixed(4)}°{lng < 0 ? "W" : "E"}
        </div>

        {/* Location label */}
        <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-medium text-foreground border border-border/50 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-primary" />
          {location}
        </div>
      </div>
    </div>
  );
};

export default MapSection;
