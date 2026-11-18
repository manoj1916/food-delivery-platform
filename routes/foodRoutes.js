
const express = require("express");

const router = express.Router();

const {
    getRestaurantMenu,
    searchFood
} = require("../controllers/foodController");

// Search food
router.get("/search", searchFood);

// Get restaurant menu
router.get("/restaurants/:id/menu", getRestaurantMenu);

module.exports = router;
