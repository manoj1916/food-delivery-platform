
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String
        },

        role: {
            type: String,
            enum: [
                "customer",
                "restaurant_owner",
                "delivery_partner",
                "admin"
            ],
            default: "customer"
        },

        requestedRole: {
            type: String,
            enum: ["restaurant_owner", "delivery_partner", null],
            default: null
        },

        applicationStatus: {
            type: String,
            enum: ["not_applied", "pending", "approved", "rejected"],
            default: "not_applied"
        },

        isAvailable: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
