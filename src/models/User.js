const mongoose = require("mongoose");

const User = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    picture: { type: String },
    status: { type: String, default: "active" },
    phone: { type: String },
    planType: { type: String }, // yearly, monthly
    stripeDetails: { type: Object }, // stripeCustomerId, paymentMethodId, stripeConnectAccountId, stripeConnectActive
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    emailVerified: { type: Boolean, default: false },
    twoFactorAuth: { type: Boolean, default: false },
    permissions: {
      type: Array,
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },

  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

module.exports = mongoose.models.User || mongoose.model("User", User);
