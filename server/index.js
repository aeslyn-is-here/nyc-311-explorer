const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const AlertRule = require("./models/AlertRule");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// Health check route
app.get("/", (req, res) => {
  res.send("Local 311 Alerts API is running");
});

app.get("/api/complaint-types", async (req, res) => {
  try {
    const response = await axios.get(process.env.NYC_311_API_URL, {
      params: {
        $select: "complaint_type",
        $group: "complaint_type",
        $order: "complaint_type ASC",
        $limit: 1000,
      },
    });

    const complaintTypes = response.data
      .map((item) => item.complaint_type)
      .filter(Boolean);

    res.json(complaintTypes);
  } catch (error) {
    console.error("Error fetching complaint types:", error.message);
    res.status(500).json({ error: "Failed to fetch complaint types" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    const today = new Date();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const query = `
      SELECT *
      WHERE incident_zip='${zip}'
      AND complaint_type='${complaintType}'
      ORDER BY created_date DESC
      LIMIT 5000
    `;

    const response = await axios.get(process.env.NYC_311_API_URL, {
      params: {
        $query: query,
      },
    });

    const complaints = response.data;

    let currentWeek = 0;
    let previousWeek = 0;

    complaints.forEach((complaint) => {
      const createdDate = new Date(complaint.created_date);

      if (createdDate >= sevenDaysAgo && createdDate < today) {
        currentWeek++;
      } else if (
        createdDate >= fourteenDaysAgo &&
        createdDate < sevenDaysAgo
      ) {
        previousWeek++;
      }
    });

    let percentChange = null;

    if (previousWeek > 0) {
      percentChange = ((currentWeek - previousWeek) / previousWeek) * 100;
    }

    res.json({
      zip,
      complaintType,
      currentWeek,
      previousWeek,
      percentChange,
      totalRecordsChecked: complaints.length,
      currentWindow: {
        start: sevenDaysAgo.toISOString(),
        end: today.toISOString(),
      },
      previousWindow: {
        start: fourteenDaysAgo.toISOString(),
        end: sevenDaysAgo.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error calculating stats:", error.message);

    res.status(500).json({
      error: "Failed to calculate stats",
    });
  }
});

app.get("/api/trend", async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    const today = new Date();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const query = `
      SELECT *
      WHERE incident_zip='${zip}'
      AND complaint_type='${complaintType}'
      ORDER BY created_date DESC
      LIMIT 5000
    `;

    const response = await axios.get(process.env.NYC_311_API_URL, {
      params: {
        $query: query,
      },
    });

    const complaints = response.data;

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
    console.error("Error fetching trend data:", error.message);

    res.status(500).json({
      error: "Failed to fetch trend data",
    });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const alertRules = await AlertRule.find();

    res.json(alertRules);
  } catch (error) {
    console.error("Error fetching alert rules:", error.message);

    res.status(500).json({
      error: "Failed to fetch alert rules",
    });
  }
});

app.post("/api/alerts", async (req, res) => {
  try {
    const { zip, complaintType, threshold } = req.body;

    if (!zip || !complaintType) {
      return res.status(400).json({
        error: "ZIP code and complaint type are required",
      });
    }

    const alertRule = await AlertRule.create({
      zip,
      complaintType,
      threshold,
      isActive: true,
    });

    res.status(201).json(alertRule);
  } catch (error) {
    console.error("Error creating alert rule:", error.message);

    res.status(500).json({
      error: "Failed to create alert rule",
    });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAlert = await AlertRule.findByIdAndDelete(id);

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
    console.error("Error deleting alert rule:", error.message);

    res.status(500).json({
      error: "Failed to delete alert rule",
    });
  }
});

app.patch("/api/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedAlert = await AlertRule.findByIdAndUpdate(
      id,
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
    console.error("Error updating alert rule:", error.message);

    res.status(500).json({
      error: "Failed to update alert rule",
    });
  }
});

// Complaints route
app.get("/api/complaints", async (req, res) => {
  try {
    const { zip, complaintType } = req.query;

    if (!zip) {
      return res.status(400).json({
        error: "ZIP code is required",
      });
    }

    let query = `
      SELECT *
      WHERE incident_zip='${zip}'
    `;

    if (complaintType) {
      query += ` AND complaint_type='${complaintType}'`;
    }

    query += `
      ORDER BY created_date DESC
      LIMIT 25
    `;

    const response = await axios.get(process.env.NYC_311_API_URL, {
      params: {
        $query: query,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching complaints:", error.message);

    res.status(500).json({
      error: "Failed to fetch complaints",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});