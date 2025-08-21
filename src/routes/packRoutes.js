const express = require('express');
const router = express.Router();
const packController = require('../controllers/packController');
const authMiddleware = require("../middlewares/auth");

router.post('/', authMiddleware, packController.create);
router.get('/', packController.getAll);
router.get('/:id', packController.getById);
router.put('/:id', authMiddleware, packController.update);
router.delete('/:id', authMiddleware, packController.delete);

module.exports = router;
