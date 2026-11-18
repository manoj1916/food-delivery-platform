
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Restaurant = require("../models/Restaurant");

const DELIVERY_FEE = 30;

// 1. Place Order
const placeOrder = async (req, res) => {
    try {
        const { deliveryAddress } = req.body;

        if (!deliveryAddress || !deliveryAddress.trim()) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required"
            });
        }

        // Get customer's cart
        const cart = await Cart.findOne({
            userId: req.user.id
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        // Verify restaurant is still open
        const restaurant = await Restaurant.findOne({
            _id: cart.restaurantId,
            isOpen: true
        });

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: "Restaurant is closed or unavailable"
            });
        }

        // Validate food items and get current prices
        const orderItems = [];

        for (const cartItem of cart.items) {
            let food = null;

            for (const category of restaurant.menuCategories) {
                const foundItem = category.items.id(
                    cartItem.foodItemId
                );

                if (foundItem) {
                    food = foundItem;
                    break;
                }
            }

            if (!food || !food.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `${cartItem.name} is unavailable`
                });
            }

            orderItems.push({
                foodItemId: food._id,
                name: food.name,
                price: food.price,
                quantity: cartItem.quantity
            });
        }

        // Calculate food subtotal using current menu prices
        const subtotal = orderItems.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        // Add delivery fee
        const totalAmount = subtotal + DELIVERY_FEE;

        // Create order
        const order = await Order.create({
            userId: req.user.id,
            restaurantId: restaurant._id,
            items: orderItems,
            deliveryAddress: deliveryAddress.trim(),
            totalAmount
        });

        // Clear customer's cart after successful order creation
        await Cart.findByIdAndDelete(cart._id);

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: error.message
        });
    }
};

// 2. Get My Orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.user.id
        })
            .populate("restaurantId", "name address")
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

// 3. Get Single Order
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            userId: req.user.id
        }).populate("restaurantId", "name address");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch order"
        });
    }
};

// 4. Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (!["placed", "confirmed"].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "This order can no longer be cancelled"
            });
        }

        order.orderStatus = "cancelled";

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to cancel order"
        });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder
};
