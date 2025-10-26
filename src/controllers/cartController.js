const User = require('../models/User');
const Card = require('../models/Card');
const Pack = require('../models/Pack');
const { validationResult } = require('express-validator');

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { itemType, itemId, quantity = 1 } = req.body;
        const userId = req.user.id;

        // Validate item exists and get price
        let item, price;
        if (itemType === 'card') {
            item = await Card.findById(itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Card not found'
                });
            }
            price = item.price;
        } else if (itemType === 'pack') {
            item = await Pack.findById(itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Pack not found'
                });
            }
            price = item.price;
        } else if (itemType === 'coins') {
            // For coins, itemId represents the coin amount
            price = parseInt(itemId);
            if (isNaN(price) || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coin amount'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid item type'
            });
        }

        // Get user and update cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = user.cart.items.findIndex(
            cartItem => cartItem.itemType === itemType && 
                       cartItem.itemId.toString() === itemId.toString()
        );

        if (existingItemIndex !== -1) {
            // Update existing item quantity
            user.cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            user.cart.items.push({
                itemType,
                itemId: itemType === 'coins' ? null : itemId,
                quantity,
                price
            });
        }

        // Recalculate total amount
        user.cart.totalAmount = user.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// View cart items
const viewCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate('cart.items.itemId');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Populate cart items with full details
        const populatedCartItems = await Promise.all(
            user.cart.items.map(async (cartItem) => {
                let itemDetails = null;
                
                if (cartItem.itemType === 'card' && cartItem.itemId) {
                    itemDetails = await Card.findById(cartItem.itemId);
                } else if (cartItem.itemType === 'pack' && cartItem.itemId) {
                    itemDetails = await Pack.findById(cartItem.itemId);
                } else if (cartItem.itemType === 'coins') {
                    itemDetails = {
                        _id: 'coins',
                        name: 'Coins',
                        price: cartItem.price,
                        description: 'Virtual currency for future features'
                    };
                }

                return {
                    ...cartItem.toObject(),
                    itemDetails
                };
            })
        );

        res.status(200).json({
            success: true,
            cart: {
                items: populatedCartItems,
                totalAmount: user.cart.totalAmount,
                itemCount: user.cart.items.length
            }
        });

    } catch (error) {
        console.error('View cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { itemType, itemId, quantity } = req.body;
        const userId = req.user.id;

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const itemIndex = user.cart.items.findIndex(
            cartItem => cartItem.itemType === itemType && 
                       cartItem.itemId.toString() === itemId.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        user.cart.items[itemIndex].quantity = quantity;

        // Recalculate total amount
        user.cart.totalAmount = user.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const itemIndex = user.cart.items.findIndex(
            cartItem => cartItem.itemType === itemType && 
                       cartItem.itemId.toString() === itemId.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        user.cart.items.splice(itemIndex, 1);

        // Recalculate total amount
        user.cart.totalAmount = user.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.cart.items = [];
        user.cart.totalAmount = 0;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    addToCart,
    viewCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
