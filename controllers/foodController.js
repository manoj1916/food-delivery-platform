
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

// 1. Get Restaurant Menu
const getRestaurantMenu = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const restaurant = await Restaurant.findById(id)
            .select("name cuisine isOpen menuCategories");

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        res.status(200).json({
            success: true,
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                cuisine: restaurant.cuisine,
                isOpen: restaurant.isOpen,
                menuCategories: restaurant.menuCategories
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurant menu"
        });
    }
};

// 2. Search Food Items
const searchFood = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || !keyword.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a food search keyword"
            });
        }

        const restaurants = await Restaurant.find({
            isOpen: true,
            "menuCategories.items": {
                $elemMatch: {
                    name: {
                        $regex: keyword.trim(),
                        $options: "i"
                    },
                    isAvailable: true
                }
            }
        }).select("name address cuisine menuCategories");

        // Extract matching food items
        const results = [];

        restaurants.forEach((restaurant) => {
            restaurant.menuCategories.forEach((category) => {
                category.items.forEach((item) => {
                    if (
                        item.isAvailable &&
                        item.name.toLowerCase().includes(keyword.trim().toLowerCase())
                    ) {
                        results.push({
                            restaurantId: restaurant._id,
                            restaurantName: restaurant.name,
                            address: restaurant.address,
                            categoryName: category.categoryName,
                            foodItem: item
                        });
                    }
                });
            });
        });

        res.status(200).json({
            success: true,
            count: results.length,
            results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Food search failed"
        });
    }
};

module.exports = {
    getRestaurantMenu,
    searchFood
};
