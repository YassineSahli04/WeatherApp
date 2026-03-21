const express = require("express");
const cors = require("cors");
const weatherRoutes = require("./routes/weatherRoutes");
const placeSearchRoutes = require("./routes/placeSearchRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    service: "weather-backend",
    status: "ok",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/weather", weatherRoutes);
app.use("/places", placeSearchRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
