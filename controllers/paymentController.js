
const mongoose = require("mongoose");
const Order = require("../models/Order");

// Simulated Payment API
const processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentResult } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        if (!["success", "failure"].includes(paymentResult)) {
            return res.status(400).json({
                success: false,
                message: "Payment result must be success or failure"
            });
        }

        // Find customer's order
        const order = await Order.findOne({
            _id: orderId,
            userId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Prevent duplicate payment
        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment already completed"
            });
        }

        if (order.paymentStatus === "failed") {
            return res.status(400).json({
                success: false,
                message: "This payment has already failed"
            });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot pay for a cancelled order"
            });
        }

        // Simulate payment result
        if (paymentResult === "success") {
            order.paymentStatus = "paid";
        } else {
            order.paymentStatus = "failed";
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: paymentResult === "success"
                ? "Payment successful"
                : "Payment failed",
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            orderId: order._id
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Payment processing failed"
        });
    }
};

module.exports = {
    processPayment
};
