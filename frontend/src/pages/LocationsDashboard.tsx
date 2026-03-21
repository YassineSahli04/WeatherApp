import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, CalendarDays, Clock3, FileSpreadsheet, FileJson, Loader2, Trash2, Navigation } from "lucide-react";
import {
  fetchLocationDashboardData,
  downloadDailyForecastExport,
  deleteWeatherRecordById,
  type DailyExportFormat,
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

function canExportItem(item: LocationDashboardItem): boolean {
  return (
    item.latitude !== null &&
    item.longitude !== null &&
    Boolean(item.startDate) &&
    Boolean(item.endDate)
  );
}

type DownloadState = {
  key: string;
  format: DailyExportFormat;
} | null;

type DeleteState = string | null;
type SelectState = string | null;

const LOCATION_STORAGE_KEY = "weatherapp:selected-location";
const DRAFT_RANGE_STORAGE_KEY = "weatherapp:date-range-draft";
const APPLIED_RANGE_STORAGE_KEY = "weatherapp:date-range-applied";

const ExportIcons = ({
  item,
  rowKey,
  downloadState,
  deleteState,
  selectState,
  onDownload,
  onDelete,
  onSelect,
}: {
  item: LocationDashboardItem;
  rowKey: string;
  downloadState: DownloadState;
  deleteState: DeleteState;
  selectState: SelectState;
  onDownload: (item: LocationDashboardItem, format: DailyExportFormat, rowKey: string) => void;
  onDelete: (item: LocationDashboardItem, rowKey: string) => void;
  onSelect: (item: LocationDashboardItem, rowKey: string) => void;
}) => {
  const canExport = canExportItem(item);
  const isCsvLoading =
    downloadState?.key === rowKey && downloadState?.format === "csv";
  const isJsonLoading =
    downloadState?.key === rowKey && downloadState?.format === "json";
  const isDeleteLoading = deleteState === rowKey;
  const isSelectLoading = selectState === rowKey;
  const canSelect = item.latitude !== null && item.longitude !== null;
  const canDelete = Number.isInteger(item.id);
  const isAnyLoading =
    Boolean(downloadState) || Boolean(deleteState) || Boolean(selectState);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect(item, rowKey)}
        disabled={!canSelect || isAnyLoading}
        title="Use this location"
        aria-label="Use this location"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
      >
        {isSelectLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDownload(item, "csv", rowKey)}
        disabled={!canExport || isAnyLoading}
        title="Download CSV"
        aria-label="Download CSV"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {isCsvLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDownload(item, "json", rowKey)}
        disabled={!canExport || isAnyLoading}
        title="Download JSON"
        aria-label="Download JSON"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {isJsonLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileJson className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDelete(item, rowKey)}
        disabled={!canDelete || isAnyLoading}
        title="Delete record"
        aria-label="Delete record"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        {isDeleteLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

const MobileLocationCard = ({
  item,
  index,
  downloadState,
  deleteState,
  selectState,
  onDownload,
  onDelete,
  onSelect,
}: {
  item: LocationDashboardItem;
  index: number;
  downloadState: DownloadState;
  deleteState: DeleteState;
  selectState: SelectState;
  onDownload: (item: LocationDashboardItem, format: DailyExportFormat, rowKey: string) => void;
  onDelete: (item: LocationDashboardItem, rowKey: string) => void;
  onSelect: (item: LocationDashboardItem, rowKey: string) => void;
}) => {
  const rowKey = String(item.id ?? `${item.location}-${index}`);

  return (
  <article className="weather-card">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          {item.location || "Unknown location"}
        </h2>
      </div>
      <ExportIcons
        item={item}
        rowKey={rowKey}
        downloadState={downloadState}
        deleteState={deleteState}
        selectState={selectState}
        onDownload={onDownload}
        onDelete={onDelete}
        onSelect={onSelect}
      />
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
};

const LocationsDashboard = () => {
  const navigate = useNavigate();
  const [downloadState, setDownloadState] = useState<DownloadState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [selectState, setSelectState] = useState<SelectState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["weather-location-dashboard"],
    queryFn: fetchLocationDashboardData,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const rows = data || [];
  const requestError = error instanceof Error ? error.message : null;
  const isBusy = isLoading || isFetching;

  const handleDownload = async (
    item: LocationDashboardItem,
    format: DailyExportFormat,
    rowKey: string,
  ) => {
    if (!canExportItem(item) || downloadState || deleteState || selectState) {
      return;
    }

    setActionError(null);
    setDownloadState({ key: rowKey, format });
    try {
      await downloadDailyForecastExport({
        lat: item.latitude as number,
        lon: item.longitude as number,
        dateRange: {
          start: item.startDate as string,
          end: item.endDate as string,
        },
        displayLocation:
          item.location || `${item.latitude ?? ""},${item.longitude ?? ""}`,
        format,
      });
    } catch (downloadIssue) {
      setActionError(
        downloadIssue instanceof Error
          ? downloadIssue.message
          : "Unable to download export file.",
      );
    } finally {
      setDownloadState(null);
    }
  };

  const handleDelete = async (item: LocationDashboardItem, rowKey: string) => {
    if (!Number.isInteger(item.id) || downloadState || deleteState || selectState) {
      return;
    }

    setActionError(null);
    setDeleteState(rowKey);
    try {
      await deleteWeatherRecordById(item.id as number);
      await refetch();
    } catch (deleteIssue) {
      setActionError(
        deleteIssue instanceof Error
          ? deleteIssue.message
          : "Unable to delete record.",
      );
    } finally {
      setDeleteState(null);
    }
  };

  const handleSelect = async (item: LocationDashboardItem, rowKey: string) => {
    if (
      item.latitude === null ||
      item.longitude === null ||
      downloadState ||
      deleteState ||
      selectState
    ) {
      return;
    }

    setActionError(null);
    setSelectState(rowKey);
    try {
      window.localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify({
          lat: item.latitude,
          lon: item.longitude,
          displayLocation:
            item.location || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
        }),
      );

      if (item.startDate && item.endDate) {
        const range = JSON.stringify({
          start: item.startDate,
          end: item.endDate,
        });
        window.localStorage.setItem(DRAFT_RANGE_STORAGE_KEY, range);
        window.localStorage.setItem(APPLIED_RANGE_STORAGE_KEY, range);
      }

      navigate("/");
    } catch (selectIssue) {
      setActionError(
        selectIssue instanceof Error
          ? selectIssue.message
          : "Unable to select this location.",
      );
    } finally {
      setSelectState(null);
    }
  };

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
                  index={index}
                  downloadState={downloadState}
                  deleteState={deleteState}
                  selectState={selectState}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
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
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, index) => {
                      const rowKey = String(item.id ?? `${item.location}-${index}`);

                      return (
                        <tr key={rowKey} className="border-t border-border/60">
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
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <ExportIcons
                                item={item}
                                rowKey={rowKey}
                                downloadState={downloadState}
                                deleteState={deleteState}
                                selectState={selectState}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onSelect={handleSelect}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {actionError && (
          <section className="weather-card border border-destructive/30 bg-destructive/5">
            <p className="text-xs text-destructive">{actionError}</p>
          </section>
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
