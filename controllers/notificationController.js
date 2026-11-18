
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Get My Notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.id
        }).sort({ createdAt: -1 });

        const unreadCount = notifications.filter(
            notification => !notification.isRead
        ).length;

        res.status(200).json({
            success: true,
            unreadCount,
            notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications"
        });
    }
};

// Mark Notification as Read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                userId: req.user.id
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update notification"
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
