const router = require('express').Router();
const {register, login, userFromToken, requestPasswordReset, 
  submitPasswordReset, changeMyPassword, update2FAStatus,
  updateProfile, verifyOTP, uploadImage} = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const fileUpload = require('../middlewares/fileUpload');
const {body, param} = require('express-validator');
const User = require('../models/User');
const validationResultMiddleware = require('../middlewares/validationResultMiddleware');  

router.post(
  "/register",
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .notEmpty()
    .withMessage("Invalid Email")
    .custom(async (value, { req, loc, path }) => {
      const alreadyExists = await User.findOne({
        email: value,
      });
      if (alreadyExists) {
        throw new Error("Email already exists");
      } else {
        return value;
      }
    }),
  validationResultMiddleware,
  // fileUpload.fields([{ name: 'image'}, { name: 'document'}]),
  register
);

router.put(
  "/update-profile",
  authMiddleware,
  body("name").notEmpty().withMessage("Name is required"),
  validationResultMiddleware,
  updateProfile
);


router.post(
  "/login",
  body("email").isEmail().notEmpty().withMessage("Invalid Email"),
  body("password").notEmpty().withMessage("Password is required"),
  validationResultMiddleware,
  login
);

router.get("/user", userFromToken);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", submitPasswordReset);

router.put("/change-password", authMiddleware, changeMyPassword);

router.post(
  "/verify-otp",
  body("email").isEmail().notEmpty().withMessage("Email is required"),
  body("otp").notEmpty().withMessage("Otp is required"),
  validationResultMiddleware,
  verifyOTP
);

router.post(
  "/update-profile-image",
  authMiddleware,
  // body("image").notEmpty().withMessage("image is required"),
  // validationResultMiddleware,
  uploadImage
);


router.put(
  "/update-2fa-status",
  body("enable").notEmpty().withMessage("enable is required"),
  validationResultMiddleware,
  authMiddleware,
  update2FAStatus
);

module.exports = router;
