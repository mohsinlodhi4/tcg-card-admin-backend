const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const authMiddleware = require("../middlewares/auth");

router.post('/', authMiddleware, cardController.create);
router.get('/', cardController.getAll);
router.get('/:id', cardController.getById);
router.put('/:id', authMiddleware, cardController.update);
router.delete('/:id', authMiddleware, cardController.delete);

module.exports = router;
