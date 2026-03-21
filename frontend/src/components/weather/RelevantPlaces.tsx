import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { PlaceSearchItem } from "@/services/weatherApi";

interface RelevantPlacesProps {
  places: PlaceSearchItem[];
  isLoading?: boolean;
  error?: string | null;
}

const RelevantPlaces: React.FC<RelevantPlacesProps> = ({
  places,
  isLoading = false,
  error = null,
}) => {
  return (
    <section className="weather-card animate-fade-in">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Relevant Places Nearby
      </h3>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {isLoading && places.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-xl bg-secondary/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && places.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No relevant places found for this location.
        </p>
      )}

      {places.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {places.map((place, index) => (
            <article
              key={`${place.name || "place"}-${index}`}
              className="rounded-xl border border-border/60 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {place.name || "Unknown place"}
                  </h4>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {place.location.formattedAddress ||
                        [
                          place.location.address,
                          place.location.locality,
                          place.location.region,
                          place.location.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "-"}
                    </span>
                  </p>
                </div>

                {place.website ? (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground"
                    title="Open website"
                    aria-label="Open website"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No site</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default RelevantPlaces;
