const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    notificationMethod: {
        type: String,
        enum: ["none", "slack", "email", "both"],
        default: "none",
    },
    slackWebhookUrl: {
       type: String,
       default: "",
       maxlength: 500,
    },
    emailNotificationAddress: {
        type: String,
        default: "",
        maxlength: 254,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;