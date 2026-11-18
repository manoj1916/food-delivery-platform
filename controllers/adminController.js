
const mongoose = require("mongoose");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const ACTIVE_ORDER_STATUSES = [
    "placed",
    "confirmed",
    "preparing",
    "out_for_delivery"
];

// Dashboard Statistics
const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments();
        const totalOrders = await Order.countDocuments();

        const paidOrders = await Order.find({
            paymentStatus: "paid"
        }).select("totalAmount");

        const totalRevenue = paidOrders.reduce(
            (total, order) => total + order.totalAmount,
            0
        );

        res.status(200).json({
            success: true,
            statistics: {
                totalUsers,
                totalRestaurants,
                totalOrders,
                totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics"
        });
    }
};

// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

// Get All Orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("userId", "name email")
            .populate("restaurantId", "name")
            .populate("deliveryPartnerId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

// Get Pending Role Applications
const getRoleApplications = async (req, res) => {
    try {
        const applications = await User.find({
            applicationStatus: "pending",
            requestedRole: {
                $in: ["restaurant_owner", "delivery_partner"]
            }
        })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch applications"
        });
    }
};

// Approve Role Application
const approveRoleApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID"
            });
        }

        const user = await User.findOne({
            _id: id,
            applicationStatus: "pending",
            requestedRole: {
                $in: ["restaurant_owner", "delivery_partner"]
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Pending application not found"
            });
        }

        user.role = user.requestedRole;
        user.applicationStatus = "approved";
        user.requestedRole = null;

        if (user.role === "delivery_partner") {
            user.isAvailable = false;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Application approved successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                applicationStatus: user.applicationStatus,
                isAvailable: user.isAvailable
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to approve application"
        });
    }
};

// Reject Role Application
const rejectRoleApplication = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID"
            });
        }

        const user = await User.findOne({
            _id: id,
            applicationStatus: "pending"
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Pending application not found"
            });
        }

        user.applicationStatus = "rejected";
        user.requestedRole = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Application rejected successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to reject application"
        });
    }
};

// Get Registered Delivery Partners
const getDeliveryPartners = async (req, res) => {
    try {
        const partners = await User.find({
            role: "delivery_partner"
        })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: partners.length,
            partners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch delivery partners"
        });
    }
};

// Admin Updates Delivery Partner Availability
const updatePartnerAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery partner ID"
            });
        }

        if (typeof isAvailable !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isAvailable must be true or false"
            });
        }

        const partner = await User.findOneAndUpdate(
            {
                _id: id,
                role: "delivery_partner"
            },
            {
                isAvailable
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery partner availability updated",
            partner
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update availability"
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be deleted through this API"
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete user"
        });
    }
};

// Admin Delete Restaurant
const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        const activeOrders = await Order.countDocuments({
            restaurantId: id,
            orderStatus: { $in: ACTIVE_ORDER_STATUSES }
        });

        if (activeOrders > 0) {
            return res.status(409).json({
                success: false,
                message: "This restaurant has active orders and cannot be deleted"
            });
        }

        await Cart.deleteMany({ restaurantId: id });
        await Restaurant.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete restaurant"
        });
    }
};

// Admin Delete Food Item
const deleteFoodItem = async (req, res) => {
    try {
        const { id, categoryId, itemId } = req.params;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(categoryId) ||
            !mongoose.isValidObjectId(itemId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant, category or food item ID"
            });
        }

        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        const category = restaurant.menuCategories.id(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Menu category not found"
            });
        }

        const item = category.items.id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        const activeOrder = await Order.exists({
            restaurantId: id,
            orderStatus: { $in: ACTIVE_ORDER_STATUSES },
            "items.foodItemId": itemId
        });

        if (activeOrder) {
            return res.status(409).json({
                success: false,
                message: "This food item belongs to an active order and cannot be deleted"
            });
        }

        item.deleteOne();
        await restaurant.save();

        await Cart.updateMany(
            { restaurantId: id },
            {
                $pull: {
                    items: { foodItemId: itemId }
                }
            }
        );

        await Cart.deleteMany({
            restaurantId: id,
            items: { $size: 0 }
        });

        res.status(200).json({
            success: true,
            message: "Food item deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete food item"
        });
    }
};

module.exports = {
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
};
