const express = require('express');
const router = express.Router();
const productController = require('../controllers/packController');
const authMiddleware = require("../middlewares/auth");

router.post('/', authMiddleware, productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', authMiddleware, productController.update);
router.delete('/:id', authMiddleware, productController.delete);

module.exports = router;
