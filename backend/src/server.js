const app = require("./app");
const { env } = require("./config/env");
const { pool } = require("./config/database");
const { ensureSchema } = require("./db/migrations");

async function startServer() {
  await ensureSchema();

  app.listen(env.PORT, () => {
    console.log(`Weather backend running on port ${env.PORT}`);
  });
}

async function stopServer() {
  await pool.end();
}

module.exports = {
  startServer,
  stopServer,
};
