const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const config = require("./config");
const authRoutes = require("./routes/auth");
const complaintsRoutes = require("./routes/complaints");
const alertsRoutes = require("./routes/alerts");
const usersRoutes = require("./routes/users");

const app = express();

// crossOriginResourcePolicy defaults to "same-origin", which browsers
// enforce independently of CORS and would block the deployed frontend
// (a different origin, by design) from reading responses even though
// our CORS allow-list above already permits it. "cross-origin" defers
// access control to CORS, which is the check we actually want here.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header, e.g. curl/Postman).
      // Passing `false` (not an Error) tells cors to just omit the
      // Access-Control-Allow-Origin header rather than raising a 500
      // that would leak a stack trace to the client.
      callback(null, !origin || config.frontendUrls.includes(origin));
    },
  })
);
// Caps the total request body size so a huge payload can't exhaust
// server memory before any route code even runs. None of this app's
// legitimate payloads (auth forms, alert rules) come close to 100kb.
app.use(express.json({ limit: "100kb" }));

// Health check route
app.get("/", (req, res) => {
  res.send("Local 311 Alerts API is running");
});

app.use("/api", authRoutes);
app.use("/api", complaintsRoutes);
app.use("/api", alertsRoutes);
app.use("/api", usersRoutes);

module.exports = app;
