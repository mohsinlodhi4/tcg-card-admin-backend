const router = require('express').Router();
const {body, param} = require('express-validator');
const validationResultMiddleware = require('../middlewares/validationResultMiddleware');
const fileUpload = require('../middlewares/fileUpload');
const { errorResponse, successResponse } = require('../utils/functions');
const FileController = require('../controllers/fileController')
/** uses auth middleware **/

router.post('/upload', fileUpload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json(errorResponse( 'No file uploaded'));
      }
    
    //   let filePath = 'uploads/' + req.file.filename;
    let filePath = req.file.url;
    return res.json(successResponse('File uploaded successfully', {filename: filePath}));
});

module.exports = router;
