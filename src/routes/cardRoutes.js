const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const authMiddleware = require("../middlewares/auth");

router.post('/', authMiddleware, cardController.create);
router.get('/', cardController.getAll);
router.get('/:id', cardController.getById);
router.put('/:id', authMiddleware, cardController.update);
router.delete('/:id', authMiddleware, cardController.delete);

// Price history routes
router.get('/:id/price-history', cardController.getPriceHistory);
router.post('/:id/price-history', authMiddleware, cardController.addPriceHistory);

module.exports = router;
