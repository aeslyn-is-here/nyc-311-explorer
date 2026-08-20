const express = require("express");
const AlertRule = require("../models/AlertRule");
const config = require("../config");
const authenticateUser = require("../middleware/auth");
const checkAlerts = require("../services/alerts");
const validate = require("../middleware/validate");
const {
  createAlertSchema,
  alertIdParamSchema,
  updateAlertSchema,
} = require("../validation/alerts");

const router = express.Router();

router.get("/alerts", authenticateUser, async (req, res) => {
  const alertRules = await AlertRule.find({
    userId: req.user.userId,
  });

  res.json(alertRules);
});

router.post(
  "/alerts",
  authenticateUser,
  validate(createAlertSchema),
  async (req, res) => {
    const { zip, complaintType, threshold } = req.body;

    const alertRule = await AlertRule.create({
      userId: req.user.userId,
      zip,
      complaintType,
      threshold,
      isActive: true,
    });

    res.status(201).json(alertRule);
  }
);

router.delete(
  "/alerts/:id",
  authenticateUser,
  validate(alertIdParamSchema),
  async (req, res) => {
    const { id } = req.params;

    const deletedAlert = await AlertRule.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!deletedAlert) {
      return res.status(404).json({
        error: "Alert rule not found",
      });
    }

    res.json({
      message: "Alert rule deleted",
      deletedAlert,
    });
  }
);

router.patch(
  "/alerts/:id",
  authenticateUser,
  validate(updateAlertSchema),
  async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedAlert = await AlertRule.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.userId,
      },
      { isActive },
      { new: true }
    );

    if (!updatedAlert) {
      return res.status(404).json({
        error: "Alert rule not found",
      });
    }

    res.json(updatedAlert);
  }
);

router.get("/check-alerts", async (req, res) => {
  if (req.get("X-Cron-Secret") !== config.cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await checkAlerts();

  res.json({
    message: "Alerts checked successfully",
  });
});

module.exports = router;
