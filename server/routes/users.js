const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const log = require("../utils/logger");
const config = require("../config");
const authenticateUser = require("../middleware/auth");
const { isValidSlackWebhookUrl } = require("../utils/validation");

const router = express.Router();

router.patch(
  "/users/notification-settings",
  authenticateUser,
  async (req, res) => {
    try {
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
    } catch (error) {
      log.error("Error updating notification settings", error);

      res.status(500).json({
        error: "Failed to update notification settings",
      });
    }
  }
);

router.get("/users/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    res.json(user);
  } catch (error) {
    log.error("Error fetching user profile", error);

    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
});

router.post("/test-slack", authenticateUser, async (req, res) => {
  try {
    await axios.post(config.slackWebhookUrl, {
      text: "Hello from NYC 311 Alerts 👋",
    });

    res.json({
      message: "Slack test message sent",
    });
  } catch (error) {
    log.error("Error sending Slack message", error);

    res.status(500).json({
      error: "Failed to send Slack message",
    });
  }
});

module.exports = router;
