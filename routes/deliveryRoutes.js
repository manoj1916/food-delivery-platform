
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    updateOrderStatus,
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    getAssignedDeliveries,
    updateDeliveryStatus,
    getRestaurantOrders
} = require("../controllers/deliveryController");

// Restaurant owner routes

// Get available delivery partners
router.get(
    "/delivery-partners/available",
    protect,
    authorizeRoles("restaurant_owner"),
    getAvailableDeliveryPartners
);

// Get orders belonging to the logged-in owner's restaurant
router.get(
    "/orders/restaurant",
    protect,
    authorizeRoles("restaurant_owner"),
    getRestaurantOrders
);

// Update order status
router.put(
    "/orders/:id/status",
    protect,
    authorizeRoles("restaurant_owner"),
    updateOrderStatus
);

// Assign delivery partner
router.put(
    "/orders/:id/assign",
    protect,
    authorizeRoles("restaurant_owner"),
    assignDeliveryPartner
);

// Delivery partner routes

// Get assigned deliveries
router.get(
    "/my-deliveries",
    protect,
    authorizeRoles("delivery_partner"),
    getAssignedDeliveries
);

// Update delivery status
router.put(
    "/deliveries/:id/status",
    protect,
    authorizeRoles("delivery_partner"),
    updateDeliveryStatus
);

module.exports = router;
