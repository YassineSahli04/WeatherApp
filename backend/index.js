const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Postgres connection (Docker service name = db)
const pool = new Pool({
  user: "postgres",
  host: "db",
  database: "WeatherDb",
  password: "postgres",
  port: 5432,
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Test DB route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
