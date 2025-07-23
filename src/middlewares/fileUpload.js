const multer = require('multer');
const path = require('path');
const {getProjectRootPath} = require('../utils/functions');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(getProjectRootPath(), 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const fileName = Date.now() + '-' + file.originalname;
        file.url = 'uploads/'+fileName;
        cb(null, fileName);
    }
});

const fileUpload = multer({ storage: storage });

module.exports = fileUpload;