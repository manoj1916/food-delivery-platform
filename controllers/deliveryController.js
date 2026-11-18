
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/Notification");

// Helper function to create notification
const createOrderNotification = async (order, message) => {
    await Notification.create({
        userId: order.userId,
        orderId: order._id,
        message
    });
};

// 1. Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const allowedStatuses = [
            "confirmed",
            "preparing",
            "out_for_delivery",
            "delivered"
        ];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const restaurant = await Restaurant.findOne({
            _id: order.restaurantId,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(403).json({
                success: false,
                message: "You cannot manage this order"
            });
        }

        const nextStatus = {
            pending: "confirmed",
            placed: "confirmed",
            confirmed: "preparing",
            preparing: "out_for_delivery",
            out_for_delivery: "delivered"
        };

        if (nextStatus[order.orderStatus] !== orderStatus) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status transition"
            });
        }

        if (
            orderStatus === "out_for_delivery" &&
            !order.deliveryPartnerId
        ) {
            return res.status(400).json({
                success: false,
                message: "Assign a delivery partner first"
            });
        }

        order.orderStatus = orderStatus;

        await order.save();

        await createOrderNotification(
            order,
            `Your order status is now ${orderStatus}`
        );

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
};

// 2. Get Available Delivery Partners
const getAvailableDeliveryPartners = async (req, res) => {
    try {
        // Find partners already handling active orders
        const busyPartnerIds = await Order.distinct(
            "deliveryPartnerId",
            {
                deliveryPartnerId: { $ne: null },
                orderStatus: {
                    $in: [
                        "placed",
                        "confirmed",
                        "preparing",
                        "out_for_delivery"
                    ]
                }
            }
        );

        // Find approved and available delivery partners
        const partners = await User.find({
            role: "delivery_partner",
            applicationStatus: "approved",
            isAvailable: true,
            _id: { $nin: busyPartnerIds }
        }).select("name email phone isAvailable");

        res.status(200).json({
            success: true,
            count: partners.length,
            partners
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch available delivery partners",
            error: error.message
        });
    }
};

// 3. Assign Delivery Partner
const assignDeliveryPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryPartnerId } = req.body;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(deliveryPartnerId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order or delivery partner ID"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const restaurant = await Restaurant.findOne({
            _id: order.restaurantId,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(403).json({
                success: false,
                message: "You cannot manage this order"
            });
        }

        if (
            ![
                "pending",
                "placed",
                "confirmed",
                "preparing"
            ].includes(order.orderStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign delivery partner at this stage"
            });
        }

        // Check partner approval and availability
        const deliveryPartner = await User.findOne({
            _id: deliveryPartnerId,
            role: "delivery_partner",
            applicationStatus: "approved",
            isAvailable: true
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner is not approved or available"
            });
        }

        // Prevent assigning a partner who already has an active delivery
        const existingDelivery = await Order.findOne({
            deliveryPartnerId: deliveryPartner._id,
            orderStatus: {
                $in: [
                    "placed",
                    "confirmed",
                    "preparing",
                    "out_for_delivery"
                ]
            },
            _id: { $ne: order._id }
        });

        if (existingDelivery) {
            return res.status(400).json({
                success: false,
                message: "This delivery partner is already handling another order"
            });
        }

        order.deliveryPartnerId = deliveryPartner._id;

        await order.save();

        await Notification.create({
            userId: order.userId,
            orderId: order._id,
            message: `Delivery partner ${deliveryPartner.name} has been assigned to your order`
        });

        res.status(200).json({
            success: true,
            message: "Delivery partner assigned successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to assign delivery partner",
            error: error.message
        });
    }
};

// 4. Get Assigned Deliveries
const getAssignedDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({
            deliveryPartnerId: req.user.id
        })
            .populate("restaurantId", "name address")
            .populate("userId", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch deliveries"
        });
    }
};

// 5. Update Delivery Status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        if (!["out_for_delivery", "delivered"].includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status"
            });
        }

        const order = await Order.findOne({
            _id: id,
            deliveryPartnerId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Assigned order not found"
            });
        }

        if (
            orderStatus === "out_for_delivery" &&
            order.orderStatus !== "preparing"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order must be preparing before dispatch"
            });
        }

        if (
            orderStatus === "delivered" &&
            order.orderStatus !== "out_for_delivery"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order must be out for delivery first"
            });
        }

        order.orderStatus = orderStatus;

        await order.save();

        await createOrderNotification(
            order,
            `Your order status is now ${orderStatus}`
        );

        res.status(200).json({
            success: true,
            message: "Delivery status updated successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update delivery status"
        });
    }
};

// 6. Get Restaurant Orders
const getRestaurantOrders = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            ownerId: req.user.id
        }).select("_id");

        if (restaurants.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                orders: []
            });
        }

        const restaurantIds = restaurants.map(
            (restaurant) => restaurant._id
        );

        const orders = await Order.find({
            restaurantId: { $in: restaurantIds }
        })
            .populate("userId", "name phone")
            .populate("restaurantId", "name address")
            .populate("deliveryPartnerId", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurant orders",
            error: error.message
        });
    }
};

module.exports = {
    updateOrderStatus,
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    getAssignedDeliveries,
    updateDeliveryStatus,
    getRestaurantOrders
};
