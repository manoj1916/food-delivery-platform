
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder
} = require("../controllers/orderController");

// All order APIs require customer login
router.use(protect);
router.use(authorizeRoles("customer"));

router.post("/", placeOrder);

router.get("/my-orders", getMyOrders);

router.get("/:id", getOrderById);

router.delete("/:id", cancelOrder);

module.exports = router;
