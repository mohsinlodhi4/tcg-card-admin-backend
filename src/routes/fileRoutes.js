const router = require('express').Router();
const {body, param} = require('express-validator');
const validationResultMiddleware = require('../middlewares/validationResultMiddleware');
const authMiddleware = require("../middlewares/auth");
const fileController = require('../controllers/fileController')

router.post('/upload', authMiddleware, fileController.uploadFile)

router.get('/:directory/:fileName', fileController.view)

module.exports = router;
