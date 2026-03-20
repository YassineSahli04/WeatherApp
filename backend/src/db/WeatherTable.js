const { pool } = require("../config/database");

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

  if (row.start_date !== stDate || row.end_date !== endDate) {
    return { needsUpdate: true };
  }

  const now = new Date();
  const updatedAt = new Date(row.updated_at);
  const diffMs = now - updatedAt;

  const ONE_HOUR = 60 * 60 * 1000;

  if (diffMs > ONE_HOUR) {
    return { needsUpdate: true };
  }

  return { needsUpdate: false };
}

module.exports = {
  isWeatherDataAvailable,
};
