const express = require("express");
const log = require("../utils/logger");
const { apiLimiter } = require("../middleware/rateLimiters");
const { isValidZip, escapeSoqlString } = require("../utils/validation");
const {
  fetchNycComplaints,
  fetchComplaintTypes,
} = require("../services/nyc311");
const calculateStats = require("../services/stats");

const router = express.Router();

router.get("/complaint-types", apiLimiter, async (req, res) => {
  try {
    const complaintTypes = await fetchComplaintTypes();

    res.json(complaintTypes);
  } catch (error) {
    log.error("Error fetching complaint types", error);
    res.status(500).json({ error: "Failed to fetch complaint types" });
  }
});

router.get("/stats", apiLimiter, async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    if (!isValidZip(zip)) {
      return res.status(400).json({ error: "ZIP code must be 5 digits" });
    }

    const stats = await calculateStats(zip, complaintType);

    res.json(stats);
  } catch (error) {
    log.error("Error calculating stats", error);

    res.status(500).json({
      error: "Failed to calculate stats",
    });
  }
});

router.get("/trend", apiLimiter, async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    if (!isValidZip(zip)) {
      return res.status(400).json({ error: "ZIP code must be 5 digits" });
    }

    const today = new Date();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const query = `
      SELECT *
      WHERE incident_zip='${zip}'
      AND complaint_type='${escapeSoqlString(complaintType)}'
      ORDER BY created_date DESC
      LIMIT 5000
    `;

    const complaints = await fetchNycComplaints(query);

    const dailyCounts = {};

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const dateKey = date.toISOString().split("T")[0];

      dailyCounts[dateKey] = 0;
    }

    complaints.forEach((complaint) => {
      const createdDate = new Date(complaint.created_date);

      if (createdDate >= fourteenDaysAgo && createdDate <= today) {
        const dateKey = createdDate.toISOString().split("T")[0];

        if (dailyCounts[dateKey] !== undefined) {
          dailyCounts[dateKey]++;
        }
      }
    });

    const trendData = Object.keys(dailyCounts).map((date) => ({
      date,
      count: dailyCounts[date],
    }));

    res.json({
      zip,
      complaintType,
      trendData,
    });
  } catch (error) {
    log.error("Error fetching trend data", error);

    res.status(500).json({
      error: "Failed to fetch trend data",
    });
  }
});

router.get("/complaints", apiLimiter, async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip) {
      return res.status(400).json({
        error: "ZIP code is required",
      });
    }

    if (!isValidZip(zip)) {
      return res.status(400).json({ error: "ZIP code must be 5 digits" });
    }

    let query = `
      SELECT *
      WHERE incident_zip='${zip}'
    `;

    if (complaintType) {
      query += ` AND complaint_type='${escapeSoqlString(complaintType)}'`;
    }

    query += `
      ORDER BY created_date DESC
      LIMIT 25
    `;

    const complaints = await fetchNycComplaints(query);

    res.json(complaints);
  } catch (error) {
    log.error("Error fetching complaints", error);

    res.status(500).json({
      error: "Failed to fetch complaints",
    });
  }
});

module.exports = router;
