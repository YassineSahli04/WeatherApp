const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const {
  getWeather,
  createWeather,
  getWeatherHistoryController,
  updateWeather,
  deleteWeather,
  exportWeather,
} = require("../controllers/weatherController");

const router = express.Router();

router.get("/", asyncHandler(getWeather));
router.post("/", asyncHandler(createWeather));
router.get("/history", asyncHandler(getWeatherHistoryController));
router.get("/export", asyncHandler(exportWeather));
router.put("/:id", asyncHandler(updateWeather));
router.delete("/:id", asyncHandler(deleteWeather));

module.exports = router;
