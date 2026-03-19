const { pool } = require("../config/database");

async function ensureSchema() {
  const query = `
    CREATE TABLE IF NOT EXISTS weather_queries (
      id BIGSERIAL PRIMARY KEY,
      location TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      weather_data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_weather_queries_created_at
      ON weather_queries (created_at DESC);
  `;

  await pool.query(query);
}

module.exports = {
  ensureSchema,
};
