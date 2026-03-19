const { pool } = require("../config/database");

function mapRecord(row) {
  if (!row) {
    return null;
  }

  const startDate = row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : null;
  const endDate = row.end_date ? new Date(row.end_date).toISOString().slice(0, 10) : null;

  return {
    id: Number(row.id),
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
    weatherData: row.weather_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createWeatherRecord({ location, latitude, longitude, dateRange, weatherData }) {
  const result = await pool.query(
    `
      INSERT INTO weather_queries (location, latitude, longitude, start_date, end_date, weather_data)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `,
    [
      location,
      latitude,
      longitude,
      dateRange?.startDate || null,
      dateRange?.endDate || null,
      JSON.stringify(weatherData),
    ],
  );

  return mapRecord(result.rows[0]);
}

async function getWeatherRecordById(id) {
  const result = await pool.query("SELECT * FROM weather_queries WHERE id = $1", [id]);
  return mapRecord(result.rows[0]);
}

async function getWeatherHistory() {
  const result = await pool.query("SELECT * FROM weather_queries ORDER BY created_at DESC");
  return result.rows.map(mapRecord);
}

async function updateWeatherRecord(id, { location, latitude, longitude, dateRange, weatherData }) {
  const result = await pool.query(
    `
      UPDATE weather_queries
      SET
        location = $2,
        latitude = $3,
        longitude = $4,
        start_date = $5,
        end_date = $6,
        weather_data = $7::jsonb,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      location,
      latitude,
      longitude,
      dateRange?.startDate || null,
      dateRange?.endDate || null,
      JSON.stringify(weatherData),
    ],
  );

  return mapRecord(result.rows[0]);
}

async function deleteWeatherRecord(id) {
  const result = await pool.query("DELETE FROM weather_queries WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

module.exports = {
  createWeatherRecord,
  getWeatherRecordById,
  getWeatherHistory,
  updateWeatherRecord,
  deleteWeatherRecord,
};
