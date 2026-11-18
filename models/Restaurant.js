
const mongoose = require("mongoose");

// Food Item Schema
const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },

    isAvailable: {
        type: Boolean,
        default: true
    }
});

// Menu Category Schema
const menuCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },

    items: [foodItemSchema]
});

// Restaurant Schema
const restaurantSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        address: {
            type: String,
            required: true
        },

        cuisine: {
            type: String
        },

        menuCategories: [menuCategorySchema],

        isOpen: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Restaurant = mongoose.model(
    "Restaurant",
    restaurantSchema
);

module.exports = Restaurant;
