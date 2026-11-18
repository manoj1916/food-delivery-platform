
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getAdminDashboard,
    getAllUsers,
    getAllOrders,
    getRoleApplications,
    approveRoleApplication,
    rejectRoleApplication,
    getDeliveryPartners,
    updatePartnerAvailability,
    deleteUser,
    deleteRestaurant,
    deleteFoodItem
} = require("../controllers/adminController");

const {
    createRestaurantByAdmin
} = require("../controllers/restaurantController");

// All routes require admin authentication
router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/dashboard", getAdminDashboard);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

router.get("/orders", getAllOrders);

// Applications
router.get("/applications", getRoleApplications);
router.put("/applications/:id/approve", approveRoleApplication);
router.put("/applications/:id/reject", rejectRoleApplication);

// Delivery partner management
router.get("/delivery-partners", getDeliveryPartners);
router.put(
    "/delivery-partners/:id/availability",
    updatePartnerAvailability
);

// Restaurant management
router.post("/restaurants", createRestaurantByAdmin);
router.delete("/restaurants/:id", deleteRestaurant);

// Food item moderation
router.delete(
    "/restaurants/:id/categories/:categoryId/items/:itemId",
    deleteFoodItem
);

module.exports = router;
