const Order = require('../models/Order');
const User = require('../models/User');
const UserItem = require('../models/UserItem');
const Card = require('../models/Card');
const Pack = require('../models/Pack');
const { validationResult } = require('express-validator');

// Place order
const placeOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { shippingAddress, notes } = req.body;
        const userId = req.user.id;

        // Get user with cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if cart is empty
        if (!user.cart.items || user.cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate all items in cart still exist and are available
        const validatedItems = [];
        let totalAmount = 0;

        for (const cartItem of user.cart.items) {
            let item, price;
            
            if (cartItem.itemType === 'card') {
                item = await Card.findById(cartItem.itemId);
                if (!item || item.status !== 'active') {
                    return res.status(400).json({
                        success: false,
                        message: `Card ${cartItem.itemId} is no longer available`
                    });
                }
                price = item.price;
            } else if (cartItem.itemType === 'pack') {
                item = await Pack.findById(cartItem.itemId);
                if (!item) {
                    return res.status(400).json({
                        success: false,
                        message: `Pack ${cartItem.itemId} is no longer available`
                    });
                }
                price = item.price;
            } else if (cartItem.itemType === 'coins') {
                price = cartItem.price;
            }

            const itemTotal = price * cartItem.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                itemType: cartItem.itemType,
                itemId: cartItem.itemId,
                quantity: cartItem.quantity,
                price: price,
                totalPrice: itemTotal
            });
        }

        // Create order
        const order = new Order({
            user: userId,
            items: validatedItems,
            totalAmount: totalAmount,
            shippingAddress: shippingAddress,
            notes: notes,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        // Add items to user's inventory
        for (const orderItem of validatedItems) {
            if (orderItem.itemType === 'coins') {
                // Add coins to user's wallet
                user.walletBalance += orderItem.quantity * orderItem.price;
            } else {
                // Add cards/packs to user's inventory
                await UserItem.findOneAndUpdate(
                    {
                        user: userId,
                        itemType: orderItem.itemType,
                        itemId: orderItem.itemId
                    },
                    {
                        $inc: { quantity: orderItem.quantity }
                    },
                    {
                        upsert: true,
                        new: true
                    }
                );
            }
        }

        // Clear user's cart
        user.cart.items = [];
        user.cart.totalAmount = 0;
        await user.save();

        // Populate order with user details
        await order.populate('user', 'name email');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: order
        });

    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders: totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Populate order items with full details
        const populatedItems = await Promise.all(
            order.items.map(async (orderItem) => {
                let itemDetails = null;
                
                if (orderItem.itemType === 'card') {
                    itemDetails = await Card.findById(orderItem.itemId);
                } else if (orderItem.itemType === 'pack') {
                    itemDetails = await Pack.findById(orderItem.itemId);
                } else if (orderItem.itemType === 'coins') {
                    itemDetails = {
                        _id: 'coins',
                        name: 'Coins',
                        description: 'Virtual currency for future features'
                    };
                }

                return {
                    ...orderItem.toObject(),
                    itemDetails
                };
            })
        );

        res.status(200).json({
            success: true,
            order: {
                ...order.toObject(),
                items: populatedItems
            }
        });

    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, paymentStatus, userId } = req.query;

        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (userId) query.user = userId;

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders: totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    placeOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders
};
