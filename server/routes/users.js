const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const config = require("../config");
const authenticateUser = require("../middleware/auth");
const { isValidSlackWebhookUrl } = require("../utils/validation");

const router = express.Router();

router.patch(
  "/users/notification-settings",
  authenticateUser,
  async (req, res) => {
    const { notificationMethod, slackWebhookUrl, emailNotificationAddress } =
      req.body;

    if (slackWebhookUrl && !isValidSlackWebhookUrl(slackWebhookUrl)) {
      return res.status(400).json({
        error:
          "Slack webhook URL must be a valid https://hooks.slack.com/... URL",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        notificationMethod,
        slackWebhookUrl,
        emailNotificationAddress,
      },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    res.json(updatedUser);
  }
);

router.get("/users/me", authenticateUser, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");

  res.json(user);
});

router.post("/test-slack", authenticateUser, async (req, res) => {
  await axios.post(config.slackWebhookUrl, {
    text: "Hello from NYC 311 Alerts 👋",
  });

  res.json({
    message: "Slack test message sent",
  });
});

module.exports = router;
