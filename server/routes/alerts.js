const express = require("express");
const AlertRule = require("../models/AlertRule");
const log = require("../utils/logger");
const config = require("../config");
const authenticateUser = require("../middleware/auth");
const checkAlerts = require("../services/alerts");

const router = express.Router();

router.get("/alerts", authenticateUser, async (req, res) => {
  try {
    const alertRules = await AlertRule.find({
      userId: req.user.userId,
    });

    res.json(alertRules);
  } catch (error) {
    log.error("Error fetching alert rules", error);

    res.status(500).json({
      error: "Failed to fetch alert rules",
    });
  }
});

router.post("/alerts", authenticateUser, async (req, res) => {
  try {
    const { zip, complaintType, threshold } = req.body;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    const alertRule = await AlertRule.create({
      userId: req.user.userId,
      zip,
      complaintType,
      threshold,
      isActive: true,
    });

    res.status(201).json(alertRule);
  } catch (error) {
    log.error("Error creating alert rule", error);

    res.status(500).json({
      error: "Failed to create alert rule",
    });
  }
});

router.delete("/alerts/:id", authenticateUser, async (req, res) => {
  try {
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
  } catch (error) {
    log.error("Error deleting alert rule", error);

    res.status(500).json({
      error: "Failed to delete alert rule",
    });
  }
});

router.patch("/alerts/:id", authenticateUser, async (req, res) => {
  try {
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
  } catch (error) {
    log.error("Error updating alert rule", error);

    res.status(500).json({
      error: "Failed to update alert rule",
    });
  }
});

router.get("/check-alerts", async (req, res) => {
  if (req.get("X-Cron-Secret") !== config.cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await checkAlerts();

    res.json({
      message: "Alerts checked successfully",
    });
  } catch (error) {
    log.error("Error checking alerts", error);

    res.status(500).json({
      error: "Failed to check alerts",
    });
  }
});

module.exports = router;
