const router = require('express').Router();
const {body, param} = require('express-validator');
const validationResultMiddleware = require('../middlewares/validationResultMiddleware');
const fileController = require('../controllers/fileController')

router.post('/upload', fileController.uploadFile)

router.get('/:directory/:fileName', fileController.view)

module.exports = router;
