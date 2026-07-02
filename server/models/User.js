const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    },
    emailNotificationAddress: {
        type: String,
        default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;