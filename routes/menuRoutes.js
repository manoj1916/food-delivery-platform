
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    addCategory,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    deleteCategory
} = require("../controllers/menuController");

// Add category - Restaurant Owner only
router.post(
    "/:id/menu/categories",
    protect,
    authorizeRoles("restaurant_owner"),
    addCategory
);

// Add food item - Restaurant Owner only
router.post(
    "/:id/menu/categories/:categoryId/items",
    protect,
    authorizeRoles("restaurant_owner"),
    addFoodItem
);

// Update food item - Restaurant Owner only
router.put(
    "/:id/menu/categories/:categoryId/items/:itemId",
    protect,
    authorizeRoles("restaurant_owner"),
    updateFoodItem
);

// Delete food item - Restaurant Owner only
router.delete(
    "/:id/menu/categories/:categoryId/items/:itemId",
    protect,
    authorizeRoles("restaurant_owner"),
    deleteFoodItem
);

// Delete category - Restaurant Owner only
router.delete(
    "/:id/menu/categories/:categoryId",
    protect,
    authorizeRoles("restaurant_owner"),
    deleteCategory
);

module.exports = router;
