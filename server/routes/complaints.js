const express = require("express");
const { apiLimiter } = require("../middleware/rateLimiters");
const { escapeSoqlString } = require("../utils/validation");
const {
  fetchNycComplaints,
  fetchComplaintTypes,
} = require("../services/nyc311");
const calculateStats = require("../services/stats");
const validate = require("../middleware/validate");
const {
  statsQuerySchema,
  trendQuerySchema,
  complaintsQuerySchema,
} = require("../validation/complaints");

const router = express.Router();

router.get("/complaint-types", apiLimiter, async (req, res) => {
  const complaintTypes = await fetchComplaintTypes();

  res.json(complaintTypes);
});

router.get(
  "/stats",
  apiLimiter,
  validate(statsQuerySchema),
  async (req, res) => {
    const { zip, complaintType } = req.query;

    const stats = await calculateStats(zip, complaintType);

    res.json(stats);
  }
);

router.get(
  "/trend",
  apiLimiter,
  validate(trendQuerySchema),
  async (req, res) => {
    const { zip, complaintType } = req.query;

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
  }
);

router.get(
  "/complaints",
  apiLimiter,
  validate(complaintsQuerySchema),
  async (req, res) => {
    const { zip, complaintType } = req.query;

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
  }
);

module.exports = router;
