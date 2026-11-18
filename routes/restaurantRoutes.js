
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
} = require("../controllers/restaurantController");

// Public routes
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);

// Restaurant owner routes
router.post(
    "/",
    protect,
    authorizeRoles("restaurant_owner"),
    createRestaurant
);

router.put(
    "/:id",
    protect,
    authorizeRoles("restaurant_owner"),
    updateRestaurant
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("restaurant_owner"),
    deleteRestaurant
);

module.exports = router;
