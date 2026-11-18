

const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

// 1. Add Menu Category
const addCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant ID"
            });
        }

        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const restaurant = await Restaurant.findOne({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
            });
        }

        restaurant.menuCategories.push({
            categoryName: categoryName.trim(),
            items: []
        });

        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Menu category added successfully",
            menuCategories: restaurant.menuCategories
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add category",
            error: error.message
        });
    }
};

// 2. Add Food Item
const addFoodItem = async (req, res) => {
    try {
        const { id, categoryId } = req.params;
        const {
            name,
            description,
            price
        } = req.body;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(categoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant or category ID"
            });
        }

        if (!name || !name.trim() || price === undefined || price === null || price === "") {
            return res.status(400).json({
                success: false,
                message: "Food name and price are required"
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number"
            });
        }

        const restaurant = await Restaurant.findOne({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
            });
        }

        const category = restaurant.menuCategories.id(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Menu category not found"
            });
        }

        category.items.push({
            name: name.trim(),
            description,
            price: Number(price)
        });

        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Food item added successfully",
            category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add food item",
            error: error.message
        });
    }
};

// 3. Update Food Item
const updateFoodItem = async (req, res) => {
    try {
        const { id, categoryId, itemId } = req.params;
        const {
            name,
            description,
            price,
            isAvailable
        } = req.body;

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

        const restaurant = await Restaurant.findOne({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
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

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Food name cannot be empty"
                });
            }

            item.name = name.trim();
        }

        if (description !== undefined) {
            item.description = description;
        }

        if (price !== undefined) {
            if (
                !Number.isFinite(Number(price)) ||
                Number(price) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a positive number"
                });
            }

            item.price = Number(price);
        }

        if (isAvailable !== undefined) {
            if (typeof isAvailable !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isAvailable must be true or false"
                });
            }

            item.isAvailable = isAvailable;
        }

        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Food item updated successfully",
            item
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update food item",
            error: error.message
        });
    }
};

// 4. Delete Food Item
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

        const restaurant = await Restaurant.findOne({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
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

        item.deleteOne();

        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Food item deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete food item",
            error: error.message
        });
    }
};

// 5. Delete Menu Category
const deleteCategory = async (req, res) => {
    try {
        const { id, categoryId } = req.params;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(categoryId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant or category ID"
            });
        }

        const restaurant = await Restaurant.findOne({
            _id: id,
            ownerId: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or you are not its owner"
            });
        }

        const category = restaurant.menuCategories.id(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Menu category not found"
            });
        }

        category.deleteOne();

        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Menu category deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message
        });
    }
};

module.exports = {
    addCategory,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    deleteCategory
};
