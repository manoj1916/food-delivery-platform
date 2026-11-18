
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");

// 1. Create Restaurant (Restaurant Owner)
const createRestaurant = async (req, res) => {
    try {
        const { name, description, address, cuisine } = req.body;

        if (!name || !address) {
            return res.status(400).json({
                success: false,
                message: "Restaurant name and address are required"
            });
        }

        const restaurant = await Restaurant.create({
            ownerId: req.user.id,
            name,
            description,
            address,
            cuisine
        });

        res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create restaurant",
            error: error.message
        });
    }
};

// 2. Create Restaurant (Admin)
const createRestaurantByAdmin = async (req, res) => {
    try {
        const { name, description, address, cuisine, ownerId } = req.body;

        if (!name || !address || !ownerId) {
            return res.status(400).json({
                success: false,
                message: "Restaurant name, address and owner are required"
            });
        }

        if (!mongoose.isValidObjectId(ownerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant owner ID"
            });
        }

        const owner = await User.findOne({
            _id: ownerId,
            role: "restaurant_owner"
        });

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Restaurant owner not found"
            });
        }

        const restaurant = await Restaurant.create({
            ownerId: owner._id,
            name: name.trim(),
            description,
            address: address.trim(),
            cuisine
        });

        return res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            restaurant
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create restaurant",
            error: error.message
        });
    }
};

// 3. Get All Restaurants
const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();

        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurants",
            error: error.message
        });
    }
};

// 4. Get Single Restaurant
const getRestaurantById = async (req, res) => {
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

        res.status(200).json({
            success: true,
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch restaurant",
            error: error.message
        });
    }
};

// 5. Update Restaurant
const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const {
            name,
            description,
            address,
            cuisine,
            isOpen
        } = req.body;

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (address !== undefined) updateData.address = address;
        if (cuisine !== undefined) updateData.cuisine = cuisine;
        if (isOpen !== undefined) updateData.isOpen = isOpen;

        const restaurant = await Restaurant.findOneAndUpdate(
            {
                _id: id,
                ownerId: req.user.id
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update restaurant",
            error: error.message
        });
    }
};

// 6. Delete Restaurant
const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        const restaurant = await Restaurant.findOneAndDelete({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete restaurant",
            error: error.message
        });
    }
};

module.exports = {
    createRestaurant,
    createRestaurantByAdmin,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
};
