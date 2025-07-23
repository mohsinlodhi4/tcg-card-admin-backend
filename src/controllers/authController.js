const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/emails/sendEmail");
const clientURL = process.env.CLIENT_URL;
const {
  successResponse,
  errorResponse,
} = require("../utils/functions");
const fs = require("fs");
const path = require("path");

const User = require('../models/User');
const Otp = require("../models/Otp");
const Token = require('../models/Token');
const Role = require('../models/Role');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const roleName = req.params.role;

    const role = await Role.findOne({ name: roleName });
    if (!role || role.name === "admin") {
      return res
        .status(400)
        .json(errorResponse("Invalid Role", { role: roleName }));
    }

    const oldUser = await User.findOne({ email: email, role_id: role._id });
    if (oldUser) {
      return res.status(400).json(errorResponse("Email is already taken"));
    }

    let hashPassword = await bcrypt.hash(password, 10);

    let user = new User({
      name,
      email,
      password: hashPassword,
      role_id: role._id,
    });
    await user.save();
    let token = jwt.sign({ id: user._id }, process.env.JWT_ENCRYPTION_KEY);
    user.role = role;
    user = user.toObject();
    user.token = token;
    user.role = await Role.findOne({ _id: role._id });

    return res
      .status(200)
      .json(successResponse("Registration successful.", { user }));
  } catch (e) {
    let message = "Something went wrong.";
    if (e.name === "ValidationError") {
      message = e.errors[0].message;
    }
    console.error(e);
    return res.status(400).json(errorResponse(message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    let user = await User.findOne({ email: email }).populate("role");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json(errorResponse("Invalid Email or Password"));
    }

    if (user.status === "in-active") {
      return res.status(401).json(errorResponse("Your account is locked", {}));
    }

    if (user.twoFactorAuth === true) {
      console.log("Two Factor Auth", user.twoFactorAuth);
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("OTP Code", otpCode);

      // Create a new OTP document
      const otp = new Otp({
        userId: user._id,
        otp: otpCode,
        type: "login",
      });

      // Save the OTP document to the database
      await otp.save();

      // Send the OTP to the user's email
      const logo =
        "data:image/png;base64," +
        fs
          .readFileSync(path.join(__dirname, "../../", "logo.png"))
          .toString("base64");
      sendEmail(
        user.email,
        "Your Two-Factor Authentication Code",
        { name: user.name, code: otpCode, logo },
        "template/verifyOtp.handlebars"
      );

      return res
        .status(200)
        .json(
          successResponse(
            "Two-Factor Authentication code sent to your email.",
            {otpSent: true}
          )
        );
    }

    const options = {};
    if (!rememberMe) {
      options["expiresIn"] = "1h";
    }

    let token = jwt.sign(
      { id: user._id },
      process.env.JWT_ENCRYPTION_KEY,
      options
    );
    user = user.toObject();
    user.token = token;

    return res.status(200).json(successResponse("Login successful.", { user }));
  } catch (e) {
    console.error(e);
    return res.status(400).json(errorResponse("Something went wrong."));
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = req.body;
    delete data.email;
    if (data.newPassword) {
      data.password = await bcrypt.hash(data.newPassword, 10);
      delete data.newPassword;
    }
    let user = await User.findOneAndUpdate(
      {_id: req.user_id}, 
      {
        $set: {...data, setupCompleted: true},
      }, 
      {new: true})
    user.role = await Role.findById(user.role);
    return res.status(200).json(successResponse('Setup successful.', { user }));
  } catch (e) {
    let message = "Something went wrong.";
    if (e.name === "ValidationError") {
      message = e.errors[0].message;
    }
    console.error(e);
    return res.status(400).json(errorResponse(message));
  }
};
const uploadImage = async (req, res) => {
  try {
    const {image} = req.body;
    await User.updateOne({_id: req.user_id}, {$set: {picture: image}})
    return res.status(200).json(successResponse('Image updated successfully.'));
  } catch (e) {
    let message = "Something went wrong.";
    if (e.name === "ValidationError") {
      message = e.errors[0].message;
    }
    console.error(e);
    return res.status(400).json(errorResponse(message));
  }
};

const userFromToken = async (req, res) => {
  let token = req.query.token;
  if (!token) return res.status(401).json(errorResponse("Token Not found"));

  try {
    let { id } = jwt.verify(token, process.env.JWT_ENCRYPTION_KEY);
    console.log("id", id)
    let user = await User.findById(id).populate("role");
    if (!user) return res.status(400).json(errorResponse("User not found"));

    user = user.toObject();
    user.token = token;

    return res.json(successResponse("User fetched", { user }));
  } catch (e) {
    return res.status(401).json(errorResponse("Invalid Token"));
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json(errorResponse("Email is required"));

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json(errorResponse("User does not exist"));

    let token = await Token.findOne({ userId: user._id });
    if (token) await token.deleteOne();

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);

    await Token.create({
      userId: user._id,
      token: hash,
    });

    const link = `${clientURL}/auth/password-reset/${resetToken}/${user._id}`;
    sendEmail(user.email, 'Password Reset Request', { name: user.name, link: link,}, 'template/requestResetPassword.handlebars');

    return res.json(successResponse("Reset link has been sent to the email"));
  } catch (e) {
    return res.status(401).json(errorResponse(e.message));
  }
};

const submitPasswordReset = async (req, res) => {
  const { user_id, token, password } = req.body;
  if (!user_id || !token || !password)
    return res
      .status(401)
      .json(
        errorResponse("User Id, token, and password are required", req.body)
      );

  try {
    let passwordResetToken = await Token.findOne({ userId: user_id });
    if (!passwordResetToken) {
      return res
        .status(401)
        .json(errorResponse("Invalid or expired password reset token"));
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid) {
      return res
        .status(401)
        .json(errorResponse("Invalid or expired password reset token"));
    }

    const hash = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: user_id }, { password: hash });
    const user = await User.findById(user_id);

    const logo =
      "data:image/png;base64," +
      fs
        .readFileSync(path.join(__dirname, "../", "logo.png"))
        .toString("base64");
    sendEmail(
      user.email,
      "Password Reset Successfully",
      { name: user.name, logo, email: user.email },
      "template/resetPassword.handlebars"
    );

    await passwordResetToken.deleteOne();

    return res.json(successResponse("Password Reset Successfully."));
  } catch (e) {
    return res.status(401).json(errorResponse(e.message, req.body));
  }
};

const changeMyPassword = async (req, res) => {
  const user_id = req.user_id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword)
    return res
      .status(401)
      .json(
        errorResponse(
          "Current password and changed password are required.",
          req.body
        )
      );

  try {
    if (newPassword !== confirmNewPassword)
      return res
        .status(401)
        .json(errorResponse("Confirm passwords don't match", req.body));

    const user = await User.findById(user_id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json(errorResponse("Invalid Current Password"));
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: user_id }, { password: hash });

    return res.json(successResponse("Password updated successful"));
  } catch (e) {
    return res.status(401).json(errorResponse(e.message, req.body));
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, rememberMe = false } = req.body;
    if (!email) return res.status(400).json(errorResponse("Email is required"));

    let user = await User.findOne({ email: email }).populate("role");
    if (!user) return res.status(400).json(errorResponse("User not found"));

    let otpDoc = await Otp.findOne({ userId: user._id, otp, type: "login" });
    if (!otpDoc) return res.status(400).json(errorResponse("Invalid OTP"));

    await otpDoc.deleteOne();

    const options = {};
    if (!rememberMe) {
      options["expiresIn"] = "1h";
    }

    let token = jwt.sign(
      { id: user._id },
      process.env.JWT_ENCRYPTION_KEY,
      options
    );

    console.log("token", token);
    user = user.toObject();
    user.token = token;

    return res.status(200).json(successResponse("Login successful.", { user }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(errorResponse("Internal Server Error"));
  }
};

const update2FAStatus = async (req, res) => {
  try {
    let user = await User.findById(req.user_id);

    if(!user.emailVerified) {
      return res.status(400).json(errorResponse("Verify your email in order to enable 2FA."))
    }

    user.twoFactorAuth = req.body.enable;
    await user.save();

    return res
      .status(200)
      .json(successResponse("2FA Status updated successfully.", { user }));
  } catch (error) {
    let message = "Invalid Token";
    console.error(error);
    return res.status(401).json(errorResponse(message));
  }
};

module.exports = {
  register,
  login,
  updateProfile,
  userFromToken,
  requestPasswordReset,
  submitPasswordReset,
  changeMyPassword,
  verifyOTP,
  uploadImage,
  update2FAStatus,
};
