
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    processPayment
} = require("../controllers/paymentController");

// Customer payment route
router.post(
    "/:orderId/simulate",
    protect,
    authorizeRoles("customer"),
    processPayment
);

module.exports = router;
