const { pool } = require("../config/database");

function mapRecord(row) {
  if (!row) {
    return null;
  }

  const startDate = row.start_date
    ? new Date(row.start_date).toISOString().slice(0, 10)
    : null;
  const endDate = row.end_date
    ? new Date(row.end_date).toISOString().slice(0, 10)
    : null;

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

async function createWeatherRecord({
  location,
  latitude,
  longitude,
  dateRange,
  weatherData,
}) {
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

async function isWeatherDataAvailable(lat, lon) {
  const query = `
        SELECT id
        FROM weather_queries
        WHERE latitude = $1 
        AND longitude = $2
        LIMIT 1
    `;

  const res = await pool.query(query, [lat, lon]);

  if (res.rows.length > 0) {
    return {
      exists: true,
      id: res.rows[0].id,
    };
  }

  return {
    exists: false,
    id: null,
  };
}

async function doRowNeedsUpdate(id, stDate, endDate) {
  const query = `
    SELECT id, start_date, end_date, updated_at
    FROM weather_queries
    WHERE id = $1
    LIMIT 1
  `;

  const res = await pool.query(query, [id]);

  if (res.rows.length === 0) {
    return { needsUpdate: true };
  }

  const row = res.rows[0];

  const coversRange = row.start_date <= stDate && row.end_date >= endDate;

  if (!coversRange) {
    return true;
  }

  return false;
}

async function getStoredDailyWeatherData(id, dateRange) {
  const result = await pool.query(
    `
      SELECT weather_data
      FROM weather_queries
      WHERE id = $1
        AND start_date <= $3
        AND end_date >= $2
      ORDER BY created_at DESC
    `,
    [id, dateRange.startDate, dateRange.endDate],
  );

  const byDay = new Map();
  for (const row of result.rows) {
    const forecastDays = row?.weather_data?.forecast?.forecastday || [];

    for (const day of forecastDays) {
      const dayKey = String(day?.date || day?.day || "");
      if (
        dayKey &&
        dayKey >= dateRange.startDate &&
        dayKey <= dateRange.endDate &&
        !byDay.has(dayKey)
      ) {
        byDay.set(dayKey, day);
      }
    }
  }

  const days = Array.from(byDay.values()).sort((a, b) =>
    String(a?.date || a?.day || "").localeCompare(
      String(b?.date || b?.day || ""),
    ),
  );

  return {
    forecastday: days.map((day) => ({
      day: day?.date ?? day?.day ?? null,
      avgtemp_c: day?.day?.avgtemp_c ?? day?.avgtemp_c ?? null,
      daily_rain_probability_pct:
        day?.day?.daily_chance_of_rain ??
        day?.daily_rain_probability_pct ??
        (day?.day?.daily_will_it_rain ? 100 : 0),
    })),
  };
}

async function getWeatherRecordById(id) {
  const result = await pool.query(
    "SELECT * FROM weather_queries WHERE id = $1",
    [id],
  );
  return mapRecord(result.rows[0]);
}

async function getWeatherHistory() {
  const result = await pool.query(
    "SELECT * FROM weather_queries ORDER BY created_at DESC",
  );
  return result.rows.map(mapRecord);
}

async function updateWeatherDataforLocation(id, weatherData) {
  const result = await pool.query(
    `
      UPDATE weather_queries
      SET
        weather_data = $2::jsonb,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, JSON.stringify(weatherData)],
  );

  return mapRecord(result.rows[0]);
}

async function updateWeatherLocation(id, location) {
  const result = await pool.query(
    `
      UPDATE weather_queries
      SET
        location = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, location],
  );

  return mapRecord(result.rows[0]);
}

async function updateWeatherRecord(
  id,
  { location, latitude, longitude, dateRange, weatherData },
) {
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
  const result = await pool.query(
    "DELETE FROM weather_queries WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rowCount > 0;
}

module.exports = {
  createWeatherRecord,
  getStoredDailyWeatherData,
  getWeatherRecordById,
  updateWeatherDataforLocation,
  updateWeatherLocation,
  getWeatherHistory,
  updateWeatherRecord,
  deleteWeatherRecord,
  isWeatherDataAvailable,
  doRowNeedsUpdate,
};
