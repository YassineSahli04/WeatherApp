const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { getRelevantPlaces } = require("../controllers/PlaceSearchController");

const router = express.Router();

router.get("/", asyncHandler(getRelevantPlaces));

module.exports = router;
