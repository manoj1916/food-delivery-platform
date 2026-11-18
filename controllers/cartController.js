
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Restaurant = require("../models/Restaurant");

// 1. Add Food Item to Cart
const addToCart = async (req, res) => {
    try {
        const {
            restaurantId,
            foodItemId,
            quantity = 1
        } = req.body;

        if (
            !mongoose.isValidObjectId(restaurantId) ||
            !mongoose.isValidObjectId(foodItemId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid restaurant or food item ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        // Find restaurant
        const restaurant = await Restaurant.findOne({
            _id: restaurantId,
            isOpen: true
        });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found or currently closed"
            });
        }

        // Find food item inside restaurant menu
        let selectedFood = null;

        for (const category of restaurant.menuCategories) {
            const item = category.items.id(foodItemId);

            if (item) {
                selectedFood = item;
                break;
            }
        }

        if (!selectedFood) {
            return res.status(404).json({
                success: false,
                message: "Food item not found"
            });
        }

        if (!selectedFood.isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Food item is currently unavailable"
            });
        }

        // Find customer's existing cart
        let cart = await Cart.findOne({
            userId: req.user.id
        });

        // Create cart if it doesn't exist
        if (!cart) {
            cart = new Cart({
                userId: req.user.id,
                restaurantId,
                items: []
            });
        }

        // Check restaurant restriction
        if (
            cart.restaurantId.toString() !== restaurantId
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart contains items from another restaurant. Clear your cart before adding items from this restaurant."
            });
        }

        // Check whether food item already exists
        const existingItem = cart.items.find(
            (item) =>
                item.foodItemId.toString() === foodItemId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.price = selectedFood.price;
            existingItem.name = selectedFood.name;
        } else {
            cart.items.push({
                foodItemId: selectedFood._id,
                name: selectedFood.name,
                price: selectedFood.price,
                quantity
            });
        }

        await cart.save();

        // Calculate subtotal
        const subtotal = cart.items.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        res.status(200).json({
            success: true,
            message: "Food item added to cart",
            cart,
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add item to cart",
            error: error.message
        });
    }
};

// 2. Get Customer Cart
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({
            userId: req.user.id
        });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Your cart is empty",
                cart: null,
                subtotal: 0
            });
        }

        const subtotal = cart.items.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        res.status(200).json({
            success: true,
            cart,
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch cart",
            error: error.message
        });
    }
};

// 3. Update Food Item Quantity
const updateCartItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const { quantity } = req.body;

        if (!mongoose.isValidObjectId(foodItemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid food item ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        const cart = await Cart.findOne({
            userId: req.user.id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            (item) =>
                item.foodItemId.toString() === foodItemId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Food item not found in cart"
            });
        }

        item.quantity = quantity;

        await cart.save();

        const subtotal = cart.items.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart,
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update cart",
            error: error.message
        });
    }
};

// 4. Remove Food Item from Cart
const removeCartItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;

        if (!mongoose.isValidObjectId(foodItemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid food item ID"
            });
        }

        const cart = await Cart.findOne({
            userId: req.user.id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            (item) =>
                item.foodItemId.toString() === foodItemId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Food item not found in cart"
            });
        }

        item.deleteOne();

        await cart.save();

        // Delete cart if no items remain
        if (cart.items.length === 0) {
            await Cart.findByIdAndDelete(cart._id);

            return res.status(200).json({
                success: true,
                message: "Item removed. Cart is now empty",
                cart: null,
                subtotal: 0
            });
        }

        const subtotal = cart.items.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        res.status(200).json({
            success: true,
            message: "Food item removed from cart",
            cart,
            subtotal
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to remove cart item",
            error: error.message
        });
    }
};

// 5. Clear Entire Cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({
            userId: req.user.id
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart is already empty"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to clear cart",
            error: error.message
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
