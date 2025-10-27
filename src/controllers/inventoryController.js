const UserItem = require('../models/UserItem');
const User = require('../models/User');
const Card = require('../models/Card');
const Pack = require('../models/Pack');
const { validationResult } = require('express-validator');

// Get user's inventory
const getUserInventory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, itemType, search } = req.query;

        const query = { user: userId };
        if (itemType) {
            query.itemType = itemType;
        }

        const userItems = await UserItem.find(query)
            .populate('itemId')
            .sort({ acquiredAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Filter by search term if provided
        let filteredItems = userItems;
        if (search) {
            filteredItems = userItems.filter(item => {
                if (item.itemId && typeof item.itemId === 'object') {
                    return item.itemId.name && 
                           item.itemId.name.toLowerCase().includes(search.toLowerCase());
                }
                return false;
            });
        }

        // Get total count for pagination
        const totalItems = await UserItem.countDocuments(query);

        // Get inventory summary
        const inventorySummary = await UserItem.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$itemType',
                    totalItems: { $sum: '$quantity' },
                    uniqueItems: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            inventory: filteredItems,
            summary: inventorySummary,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                hasNext: page < Math.ceil(totalItems / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user inventory error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get specific item from user's inventory
const getUserItem = async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        const userId = req.user.id;

        const userItem = await UserItem.findOne({
            user: userId,
            itemType: itemType,
            itemId: itemId
        }).populate('itemId');

        if (!userItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in inventory'
            });
        }

        res.status(200).json({
            success: true,
            item: userItem
        });

    } catch (error) {
        console.error('Get user item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update item quantity in inventory
const updateItemQuantity = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { itemType, itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity cannot be negative'
            });
        }

        const userItem = await UserItem.findOne({
            user: userId,
            itemType: itemType,
            itemId: itemId
        });

        if (!userItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in inventory'
            });
        }

        if (quantity === 0) {
            // Remove item from inventory
            await UserItem.findByIdAndDelete(userItem._id);
            return res.status(200).json({
                success: true,
                message: 'Item removed from inventory'
            });
        }

        userItem.quantity = quantity;
        await userItem.save();

        res.status(200).json({
            success: true,
            message: 'Item quantity updated successfully',
            item: userItem
        });

    } catch (error) {
        console.error('Update item quantity error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user's wallet balance
const getWalletBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('walletBalance');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            walletBalance: user.walletBalance
        });

    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add coins to wallet (admin function)
const addCoinsToWallet = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { userId, amount, reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.walletBalance += amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Coins added to wallet successfully',
            newBalance: user.walletBalance,
            addedAmount: amount,
            reason: reason
        });

    } catch (error) {
        console.error('Add coins to wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await UserItem.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalCards: {
                        $sum: {
                            $cond: [
                                { $eq: ['$itemType', 'card'] },
                                '$quantity',
                                0
                            ]
                        }
                    },
                    totalPacks: {
                        $sum: {
                            $cond: [
                                { $eq: ['$itemType', 'pack'] },
                                '$quantity',
                                0
                            ]
                        }
                    },
                    uniqueCards: {
                        $sum: {
                            $cond: [
                                { $eq: ['$itemType', 'card'] },
                                1,
                                0
                            ]
                        }
                    },
                    uniquePacks: {
                        $sum: {
                            $cond: [
                                { $eq: ['$itemType', 'pack'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const user = await User.findById(userId).select('walletBalance');
        const walletBalance = user ? user.walletBalance : 0;

        res.status(200).json({
            success: true,
            stats: {
                totalCards: stats[0]?.totalCards || 0,
                totalPacks: stats[0]?.totalPacks || 0,
                uniqueCards: stats[0]?.uniqueCards || 0,
                uniquePacks: stats[0]?.uniquePacks || 0,
                walletBalance: walletBalance
            }
        });

    } catch (error) {
        console.error('Get inventory stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getUserInventory,
    getUserItem,
    updateItemQuantity,
    getWalletBalance,
    addCoinsToWallet,
    getInventoryStats
};
