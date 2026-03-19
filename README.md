# WeatherApp

Full-stack weather dashboard with:
- Frontend: React + Vite (`frontend/`)
- Backend: Node.js + Express + PostgreSQL (`backend/`)

## Backend Setup

1. Create backend env file:

```bash
cp backend/.env.example backend/.env
```

2. Set `WEATHER_API_KEY` in `backend/.env`.

3. Install dependencies:

```bash
cd backend
npm install
```

4. Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

## Backend API

### `GET /weather?location=<query>`
- Fetches live weather and forecast data for a location.

### `POST /weather`
- Body:
```json
{
  "location": "Montreal",
  "dateRange": {
    "start": "2026-03-20",
    "end": "2026-03-22"
  }
}
```
- Fetches weather and stores query + result in PostgreSQL.

### `GET /weather/history`
- Returns stored weather records.

### `PUT /weather/:id`
- Updates location/date range and refreshes stored weather payload.

### `DELETE /weather/:id`
- Deletes a stored weather record.

### `GET /weather/export?format=json|csv`
- Exports stored weather records in JSON or CSV.

## Docker Compose

From project root:

```bash
docker compose up --build
```

Set `WEATHER_API_KEY` in your shell environment (or `.env` at project root) before running compose.
