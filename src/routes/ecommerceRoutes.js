const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const inventoryController = require('../controllers/inventoryController');

// Cart Routes
router.post('/cart/add', 
    authMiddleware,
    [
        body('itemType').isIn(['card', 'pack', 'coins']).withMessage('Invalid item type'),
        body('itemId').notEmpty().withMessage('Item ID is required'),
        body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
    ],
    cartController.addToCart
);

router.get('/cart', 
    authMiddleware,
    cartController.viewCart
);

router.put('/cart/update', 
    authMiddleware,
    [
        body('itemType').isIn(['card', 'pack', 'coins']).withMessage('Invalid item type'),
        body('itemId').notEmpty().withMessage('Item ID is required'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
    ],
    cartController.updateCartItem
);

router.delete('/cart/remove/:itemType/:itemId', 
    authMiddleware,
    [
        param('itemType').isIn(['card', 'pack', 'coins']).withMessage('Invalid item type'),
        param('itemId').notEmpty().withMessage('Item ID is required')
    ],
    cartController.removeFromCart
);

router.delete('/cart/clear', 
    authMiddleware,
    cartController.clearCart
);

// Order Routes
router.post('/orders/place', 
    authMiddleware,
    [
        body('shippingAddress.street').optional().isString(),
        body('shippingAddress.city').optional().isString(),
        body('shippingAddress.state').optional().isString(),
        body('shippingAddress.zipCode').optional().isString(),
        body('shippingAddress.country').optional().isString(),
        body('notes').optional().isString()
    ],
    orderController.placeOrder
);

router.get('/orders', 
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    ],
    orderController.getUserOrders
);

router.get('/orders/:orderId', 
    authMiddleware,
    [
        param('orderId').isMongoId().withMessage('Invalid order ID')
    ],
    orderController.getOrderById
);

// Admin Order Routes
router.put('/admin/orders/:orderId/status', 
    authMiddleware,
    adminMiddleware,
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
        body('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded'])
    ],
    orderController.updateOrderStatus
);

router.get('/admin/orders', 
    authMiddleware,
    adminMiddleware,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
        query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
        query('userId').optional().isMongoId()
    ],
    orderController.getAllOrders
);

// Inventory Routes
router.get('/inventory', 
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('itemType').optional().isIn(['card', 'pack']),
        query('search').optional().isString()
    ],
    inventoryController.getUserInventory
);

router.get('/inventory/stats', 
    authMiddleware,
    inventoryController.getInventoryStats
);

router.get('/inventory/:itemType/:itemId', 
    authMiddleware,
    [
        param('itemType').isIn(['card', 'pack']).withMessage('Invalid item type'),
        param('itemId').isMongoId().withMessage('Invalid item ID')
    ],
    inventoryController.getUserItem
);

router.put('/inventory/:itemType/:itemId', 
    authMiddleware,
    [
        param('itemType').isIn(['card', 'pack']).withMessage('Invalid item type'),
        param('itemId').isMongoId().withMessage('Invalid item ID'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
    ],
    inventoryController.updateItemQuantity
);

// Wallet Routes
router.get('/wallet/balance', 
    authMiddleware,
    inventoryController.getWalletBalance
);

// Admin Wallet Routes
router.post('/admin/wallet/add-coins', 
    authMiddleware,
    adminMiddleware,
    [
        body('userId').isMongoId().withMessage('Invalid user ID'),
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        body('reason').optional().isString()
    ],
    inventoryController.addCoinsToWallet
);

module.exports = router;
