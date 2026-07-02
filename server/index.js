require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const AlertRule = require("./models/AlertRule");
const cron = require("node-cron");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const sendEmailNotification = require("./services/notifications/email");



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

const calculateStats = async (zip, complaintType) => {
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

  return {
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
  };
};

const checkAlerts = async () => {
  const activeAlerts = await AlertRule.find({ isActive: true }).populate("userId");

  for (const alert of activeAlerts) {
    const stats = await calculateStats(alert.zip, alert.complaintType);
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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error.message);

    res.status(500).json({
      error: "Failed to register user",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error.message);

    res.status(500).json({
      error: "Failed to log in",
    });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Local 311 Alerts API is running");
});

app.post("/api/test-slack", async (req, res) => {
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: "Hello from NYC 311 Alerts 👋",
    });

    res.json({
      message: "Slack test message sent",
    });
  } catch (error) {
    console.error("Error sending Slack message:", error.message);

    res.status(500).json({
      error: "Failed to send Slack message",
    });
  }
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

    const stats = await calculateStats(zip, complaintType);

    res.json(stats);
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

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

app.get("/api/alerts", authenticateUser, async (req, res) => {
  try {
    const alertRules = await AlertRule.find({
      userId: req.user.userId,
    });

    res.json(alertRules);
  } catch (error) {
    console.error("Error fetching alert rules:", error.message);

    res.status(500).json({
      error: "Failed to fetch alert rules",
    });
  }
});

app.post("/api/alerts", authenticateUser, async (req, res) => {
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
    console.error("Error creating alert rule:", error.message);

    res.status(500).json({
      error: "Failed to create alert rule",
    });
  }
});

app.delete("/api/alerts/:id", authenticateUser, async (req, res) => {
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
    console.error("Error deleting alert rule:", error.message);

    res.status(500).json({
      error: "Failed to delete alert rule",
    });
  }
});

app.patch("/api/alerts/:id", authenticateUser, async (req, res) => {
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
    console.error("Error updating alert rule:", error.message);

    res.status(500).json({
      error: "Failed to update alert rule",
    });
  }
});

app.patch("/api/users/notification-settings", authenticateUser, async (req, res) => {
  try {
    const {
      notificationMethod,
      slackWebhookUrl,
      emailNotificationAddress,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        notificationMethod,
        slackWebhookUrl,
        emailNotificationAddress,
      },
      { new: true }
    ).select("-passwordHash");

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating notification settings:", error.message);

    res.status(500).json({
      error: "Failed to update notification settings",
    });
  }
});

app.get("/api/users/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);

    res.status(500).json({
      error: "Failed to fetch user profile",
    });
  }
});

app.get("/api/check-alerts", async (req, res) => {
  try {
    await checkAlerts();

    res.json({
      message: "Alerts checked successfully",
    });
  } catch (error) {
    console.error("Error checking alerts:", error.message);

    res.status(500).json({
      error: "Failed to check alerts",
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

cron.schedule("0 * * * *", async () => {
  try {
    console.log("Running scheduled alert check...");
    await checkAlerts();
  } catch (error) {
    console.error("Scheduled alert check failed:", error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});