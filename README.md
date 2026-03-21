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
- Response keeps only daily fields needed by UI:
  - `day`
  - `avgtemp_c`
  - `daily_rain_probability_pct`

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
- Works in desktop table and mobile card layouts.

### 6) Backend-generated downloads
- Main page and dashboard both trigger backend export endpoint.
- Backend builds file and sends it as an attachment (`Content-Disposition`).
- Supported formats:
  - JSON
  - CSV

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

### Backend runtime vars

- `PORT` (default `5000`)
- `WEATHER_API_KEY`
- `WEATHER_API_BASE_URL` (default `https://api.weatherapi.com/v1`)
- `WEATHER_FORECAST_MAX_DAYS` (default `10`)
- `FSQ_API_KEY`
- `FSQ_API_BASE_URL` (default `https://places-api.foursquare.com`)
- `DATABASE_URL` or PG split vars:
  - `PGHOST`
  - `PGPORT`
  - `PGUSER`
  - `PGPASSWORD`
  - `PGDATABASE`

### Frontend runtime vars

- `VITE_API_BASE_URL` (set by compose to `http://localhost:5000`)
- `VITE_MAPBOX_TOKEN`

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

## Run locally without Docker

### 1) Start PostgreSQL
Use your local Postgres and create DB (for example `WeatherDb`).

### 2) Backend

Create `backend/.env`:

```env
PORT=5000
WEATHER_API_KEY=your_weatherapi_key
WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
WEATHER_FORECAST_MAX_DAYS=10
FSQ_API_KEY=your_foursquare_key
FSQ_API_BASE_URL=https://places-api.foursquare.com
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=WeatherDb
```

Run:

```bash
cd backend
npm install
npm run dev
```

### 3) Frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

Run:

```bash
cd frontend
npm install
npm run dev
```

## API reference

Base URL: `http://localhost:5000`

### Health

`GET /health`

Response:

```json
{ "status": "healthy" }
```

### Current weather

`GET /weather?lat=<number>&lon=<number>`

Example:

```bash
curl "http://localhost:5000/weather?lat=45.4215&lon=-75.6972"
```

### Create or fetch daily weather (cached by location)

`POST /weather?lat=<number>&lon=<number>`

Body:

```json
{
  "displayLocation": "Ottawa",
  "dateRange": {
    "start": "2026-03-10",
    "end": "2026-03-15"
  }
}
```

Response shape:

```json
{
  "forecast": {
    "forecastday": [
      {
        "day": "2026-03-10",
        "avgtemp_c": 2.3,
        "daily_rain_probability_pct": 40
      }
    ]
  }
}
```

### Export daily weather as file

`POST /weather/export/daily?lat=<number>&lon=<number>&format=json|csv`

Body same as `POST /weather`.

Returns attachment file built by backend.

### Weather history records

`GET /weather/history`

Returns all stored rows ordered by `created_at DESC`.

### Delete weather record

`DELETE /weather/:id`

### Generic history export

`GET /weather/export?format=json|csv`

### Relevant places near location

`GET /places?lat=<number>&lon=<number>`

Response:

```json
{
  "results": [
    {
      "name": "Sainte-Chapelle",
      "location": {
        "address": "10 bd du Palais",
        "locality": "Paris",
        "region": "Ile-de-France",
        "country": "FR",
        "formatted_address": "10 bd du Palais, 75001 Paris"
      },
      "website": "https://www.sainte-chapelle.fr"
    }
  ]
}
```

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

## Debugging

Backend dev command runs Node with inspector:

```bash
node --inspect=0.0.0.0:9229 index.js
```

With Docker Compose, port `9229` is exposed. In VS Code:
1. Use `Run and Debug` -> `Node.js: Attach`
2. Host: `localhost`
3. Port: `9229`

You can then hit frontend endpoints and debug backend request flow live.

## Troubleshooting

### `getaddrinfo failed` when connecting DB client
- From your host machine, use:
  - Host: `localhost`
  - Port: `5433`
- `WeatherDb` is the database name, not the host.

### `password authentication failed for user "postgres"` (`28P01`)
- Check `PGPASSWORD` in backend env.
- In Docker setup, DB password is `postgres` by default.
- If DB volume has old credentials, recreate DB volume:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

### Places endpoint returns `PLACES_API_ERROR`
- Ensure `FSQ_API_KEY` is valid.
- Backend sends Foursquare auth as Bearer token.
- Confirm `FSQ_API_BASE_URL=https://places-api.foursquare.com`.

### Changes not reflected in backend container
- Ensure backend service has source volume mount (`./backend:/app` in compose).
- Confirm `npm run dev` uses nodemon watch mode.

## Notes

- `weather_data` is intentionally stored as JSONB for cache/export workflows.
- Location/date-range state is persisted in browser `localStorage` between page navigations.
- Frontend uses placeholder data strategy in React Query to avoid full page flicker on refetch.
