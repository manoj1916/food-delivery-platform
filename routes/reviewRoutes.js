
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    addReview,
    getRestaurantReviews
} = require("../controllers/reviewController");

// Customer submits review
router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    addReview
);

// Public restaurant reviews
router.get(
    "/restaurant/:restaurantId",
    getRestaurantReviews
);

module.exports = router;
