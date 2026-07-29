const axios = require("axios");
const AlertRule = require("../models/AlertRule");
const sendEmailNotification = require("./notifications/email");
const calculateStats = require("./stats");
const log = require("../utils/logger");

const checkAlerts = async () => {
  const activeAlerts = await AlertRule.find({ isActive: true }).populate(
    "userId"
  );

  for (const alert of activeAlerts) {
    let stats;
    try {
      stats = await calculateStats(alert.zip, alert.complaintType);
    } catch (error) {
      log.error("Skipping alert", error, { alertId: alert._id });
      continue;
    }

    const user = alert.userId;

    const triggered =
      stats.percentChange !== null &&
      stats.percentChange >= alert.threshold;

    if (triggered && !alert.currentlyTriggered) {
      if (
        (user.notificationMethod === "slack" ||
          user.notificationMethod === "both") &&
        user.slackWebhookUrl
      ) {
        await axios.post(user.slackWebhookUrl, {
          text: `🚨 311 Alert Triggered: ${alert.complaintType} complaints in ZIP ${
            alert.zip
          } increased by ${stats.percentChange.toFixed(
            1
          )}% compared to the previous 7 days. Threshold: ${
            alert.threshold
          }%.`,
        });
      }

      if (
        (user.notificationMethod === "email" ||
          user.notificationMethod === "both") &&
        user.emailNotificationAddress
      ) {
        await sendEmailNotification({
          to: user.emailNotificationAddress,
          complaintType: alert.complaintType,
          zip: alert.zip,
          percentChange: stats.percentChange,
          threshold: alert.threshold,
        });
      }

      alert.currentlyTriggered = true;
      await alert.save();
    }

    if (!triggered && alert.currentlyTriggered) {
      alert.currentlyTriggered = false;
      await alert.save();
    }
  }
};

module.exports = checkAlerts;
