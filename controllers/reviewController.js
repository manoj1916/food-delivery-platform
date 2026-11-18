
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");

// Submit Review
const addReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

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

        if (order.orderStatus !== "delivered") {
            return res.status(400).json({
                success: false,
                message: "You can review only delivered orders"
            });
        }

        const existingReview = await Review.findOne({
            orderId
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this order"
            });
        }

        const review = await Review.create({
            userId: req.user.id,
            restaurantId: order.restaurantId,
            orderId,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to submit review"
        });
    }
};

// Get Restaurant Reviews
const getRestaurantReviews = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        if (!mongoose.isValidObjectId(restaurantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const reviews = await Review.find({
            restaurantId
        })
            .populate("userId", "name")
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;

        const averageRating = totalReviews === 0
            ? 0
            : reviews.reduce(
                (total, review) => total + review.rating,
                0
            ) / totalReviews;

        res.status(200).json({
            success: true,
            totalReviews,
            averageRating: Number(averageRating.toFixed(1)),
            reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews"
        });
    }
};

module.exports = {
    addReview,
    getRestaurantReviews
};
