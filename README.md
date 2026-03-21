# WeatherApp

WeatherApp is a full-stack weather project with:
- A React + Vite frontend (`frontend/`)
- A Node.js + Express backend (`backend/`)
- A PostgreSQL database (Dockerized by default)

The app lets users search a location, fetch current conditions, query daily forecast ranges, cache results in DB, explore nearby places, and export forecast files from backend endpoints.

## Features

### 1) Current weather
- Fetches live current conditions by latitude/longitude.
- Shows temperature, feels-like, condition, humidity, wind, UV, visibility, AQI, sunrise/sunset, and alerts.

### 2) Daily forecast by date range
- User picks `start` and `end` dates.
- Backend decides whether to call:
  - History API only
  - Forecast API only
  - Both, then merges results
- Response keeps only daily fields needed by UI.

### 3) Date window rules
- Minimum allowed date: `2010-01-01`
- History dates cannot be after today (UTC).
- Forecast dates cannot exceed configured max window (`WEATHER_FORECAST_MAX_DAYS`, default 10 days from today).
- Frontend date pickers enforce this range too.

### 4) Persistence and reuse
- Weather results are stored in PostgreSQL (`weather_queries`).
- Existing rows are reused for the same coordinates when possible.
- If a new range overlaps/extends existing data, backend merges by day instead of blindly replacing.

### 5) Saved locations dashboard
- Lists saved records (without rendering raw weather JSON).
- Each row supports:
  - Select location back into main page
  - Download daily forecast export (CSV/JSON)
  - Delete record

### 7) Relevant places near selected location
- Uses Foursquare Places API.
- Returns clean, minimal place shape:
  - `name`
  - main location fields
  - `website`

### 8) Map and location UX
- Mapbox-powered geocoding in search bar.
- GPS button for current location.
- Manual coordinates entry.
- 3D/satellite-style map section for selected city.

## Architecture

### Frontend
- React + TypeScript + Vite
- React Query for data fetching/caching
- React Router (`/` and `/locations`)
- Tailwind-based styling

### Backend
- Express 5
- Weather provider integration (WeatherAPI)
- Places provider integration (Foursquare Places)
- Validation + custom `AppError` error handling
- CSV utility for exports

### Data
- PostgreSQL table: `weather_queries`
- Auto-created at backend startup (`ensureSchema`)

## Repository layout

```text
WeatherApp/
  backend/
    src/
      controllers/
      routes/
      services/
      validators/
      db/
      middleware/
      utils/
  frontend/
    src/
      components/weather/
      pages/
      services/
      data/
  docker-compose.yml
  .env.example
```

## Environment variables

Root `.env` (used by Docker Compose variable substitution):

```env
WEATHER_API_KEY=your_weatherapi_key
FSQ_API_KEY=your_foursquare_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## Run with Docker (recommended)

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Postgres: `localhost:5433` (container internal is `5432`)
- Node inspector (backend): `localhost:9229`

Notes:
- Backend source is mounted as a volume for live reload (`nodemon -L`).
- Frontend source is mounted for Vite HMR.

## How to use the app

### Main page (`/`)
1. Search a place by city/address/postal code, use GPS, or pick coordinates.
2. Select a date range in the Daily Forecast card.
3. Click `Apply Range`.
4. Explore weather cards, nearby places, and map.
5. Download daily forecast as CSV or JSON.

### Saved locations dashboard (`/locations`)
1. Open dashboard from the main page.
2. Review saved records metadata.
3. Use action icons per row:
   - Navigation icon: load this location/range back in main page
   - Spreadsheet icon: download CSV
   - JSON icon: download JSON
   - Trash icon: delete record

