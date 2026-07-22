require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const mongoose = require("mongoose");
const AlertRule = require("./models/AlertRule");
const cron = require("node-cron");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const sendEmailNotification = require("./services/notifications/email");

// Structured logging: every line is one JSON object with a consistent
// shape (timestamp, level, message, optional context), instead of ad-hoc
// strings. Makes logs searchable/filterable once deployed, rather than
// relying on grep-ing free text.
const log = {
  info: (message, meta = {}) =>
    console.log(
      JSON.stringify({
        level: "info",
        message,
        time: new Date().toISOString(),
        ...meta,
      })
    ),
  error: (message, error, meta = {}) =>
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        time: new Date().toISOString(),
        ...meta,
      })
    ),
};

const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "MONGODB_URI",
  "NYC_311_API_URL",
  "CRON_SECRET",
];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  log.error("Missing required environment variable(s)", null, {
    missing: missingEnvVars,
  });
  process.exit(1);
}

const app = express();

// crossOriginResourcePolicy defaults to "same-origin", which browsers
// enforce independently of CORS and would block the deployed frontend
// (a different origin, by design) from reading responses even though
// our CORS allow-list above already permits it. "cross-origin" defers
// access control to CORS, which is the check we actually want here.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Comma-separated list of allowed frontend origins, e.g.
// FRONTEND_URL=http://localhost:5173,https://your-app.vercel.app
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header, e.g. curl/Postman).
      // Passing `false` (not an Error) tells cors to just omit the
      // Access-Control-Allow-Origin header rather than raising a 500
      // that would leak a stack trace to the client.
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  })
);
// Caps the total request body size so a huge payload can't exhaust
// server memory before any route code even runs. None of this app's
// legitimate payloads (auth forms, alert rules) come close to 100kb.
app.use(express.json({ limit: "100kb" }));

// Strict limiter for login/register: legitimate users rarely fail more
// than a few times in 15 minutes, so this makes password-guessing
// scripts impractically slow without bothering real users.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

// Looser limiter for the routes that proxy the NYC Open Data API,
// so one visitor can't hammer our server (and the external API) with
// rapid-fire requests, while normal browsing is unaffected.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
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

const PORT = process.env.PORT || 5001;

// NYC Open Data (Socrata) app token raises the API rate limit.
// Sent as an X-App-Token header on every request to the 311 dataset.
const nycApiHeaders = process.env.NYC_APP_TOKEN
  ? { "X-App-Token": process.env.NYC_APP_TOKEN }
  : {};

// Guards against SoQL injection: zip must look like a real 5-digit ZIP,
// and any text dropped into a SoQL string literal must have its
// single quotes escaped so it can't break out of the query.
const ZIP_REGEX = /^\d{5}$/;
const isValidZip = (zip) => typeof zip === "string" && ZIP_REGEX.test(zip);
const escapeSoqlString = (value) => String(value).replace(/'/g, "''");

// Basic email shape check (not fully RFC-compliant, but catches the
// obvious "not an email" cases without needing an extra library).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email);

// Password must be at least 8 characters and contain both a letter
// and a number, to rule out trivially guessable passwords.
const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[a-zA-Z]/.test(password) &&
  /[0-9]/.test(password);

// Prevents SSRF: the server later POSTs to this URL unattended, so it
// must genuinely be a Slack webhook, not an arbitrary attacker-chosen
// address. Parsing with `URL` and checking the exact hostname (rather
// than a string prefix like startsWith("https://hooks.slack.com/"))
// avoids being fooled by lookalikes such as
// "https://hooks.slack.com.evil.com/".
const isValidSlackWebhookUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "hooks.slack.com";
  } catch {
    return false;
  }
};

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    log.info("Connected to MongoDB");
  })
  .catch((error) => {
    log.error("MongoDB connection error", error);
  });

const calculateStats = async (zip, complaintType) => {
  if (!isValidZip(zip)) {
    throw new Error("Invalid ZIP code");
  }

  const today = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const query = `
    SELECT *
    WHERE incident_zip='${zip}'
    AND complaint_type='${escapeSoqlString(complaintType)}'
    ORDER BY created_date DESC
    LIMIT 5000
  `;

  const response = await axios.get(process.env.NYC_311_API_URL, {
    headers: nycApiHeaders,
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

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include a letter and a number",
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
    log.error("Error registering user", error);

    res.status(500).json({
      error: "Failed to register user",
    });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
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
    log.error("Error logging in", error);

    res.status(500).json({
      error: "Failed to log in",
    });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Local 311 Alerts API is running");
});

app.post("/api/test-slack", authenticateUser, async (req, res) => {
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
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

app.get("/api/complaint-types", apiLimiter, async (req, res) => {
  try {
    const response = await axios.get(process.env.NYC_311_API_URL, {
      headers: nycApiHeaders,
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
    log.error("Error fetching complaint types", error);
    res.status(500).json({ error: "Failed to fetch complaint types" });
  }
});

app.get("/api/stats", apiLimiter, async (req, res) => {
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

app.get("/api/trend", apiLimiter, async (req, res) => {
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

    const response = await axios.get(process.env.NYC_311_API_URL, {
      headers: nycApiHeaders,
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
    log.error("Error fetching trend data", error);

    res.status(500).json({
      error: "Failed to fetch trend data",
    });
  }
});

app.get("/api/alerts", authenticateUser, async (req, res) => {
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
    log.error("Error creating alert rule", error);

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
    log.error("Error deleting alert rule", error);

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
    log.error("Error updating alert rule", error);

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

    if (slackWebhookUrl && !isValidSlackWebhookUrl(slackWebhookUrl)) {
      return res.status(400).json({
        error: "Slack webhook URL must be a valid https://hooks.slack.com/... URL",
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
});

app.get("/api/users/me", authenticateUser, async (req, res) => {
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

app.get("/api/check-alerts", async (req, res) => {
  if (req.get("X-Cron-Secret") !== process.env.CRON_SECRET) {
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

// Complaints route
app.get("/api/complaints", apiLimiter, async (req, res) => {
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

    const response = await axios.get(process.env.NYC_311_API_URL, {
      headers: nycApiHeaders,
      params: {
        $query: query,
      },
    });

    res.json(response.data);
  } catch (error) {
    log.error("Error fetching complaints", error);

    res.status(500).json({
      error: "Failed to fetch complaints",
    });
  }
});

cron.schedule("0 * * * *", async () => {
  try {
    log.info("Running scheduled alert check");
    await checkAlerts();
  } catch (error) {
    log.error("Scheduled alert check failed", error);
  }
});

app.listen(PORT, () => {
  log.info(`Server running on port ${PORT}`);
});