
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

// All cart routes require customer authentication
router.use(protect);
router.use(authorizeRoles("customer"));

// Add item
router.post("/items", addToCart);

// Get cart
router.get("/", getCart);

// Update quantity
router.put("/items/:foodItemId", updateCartItem);

// Remove item
router.delete("/items/:foodItemId", removeCartItem);

// Clear cart
router.delete("/", clearCart);

module.exports = router;
