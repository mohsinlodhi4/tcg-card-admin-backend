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
const imageOnly = (req, file, cb)=>{
    const filetypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } 
    return cb(null, false);
}

const fileUpload = multer({ storage: storage, fileFilter: imageOnly });

module.exports = fileUpload;