require("dotenv").config();

const mongoose = require("mongoose");
const cron = require("node-cron");
const config = require("./config");
const log = require("./utils/logger");
const checkAlerts = require("./services/alerts");
const app = require("./app");

mongoose
  .connect(config.mongodbUri)
  .then(() => {
    log.info("Connected to MongoDB");
  })
  .catch((error) => {
    log.error("MongoDB connection error", error);
  });

cron.schedule("0 * * * *", async () => {
  try {
    log.info("Running scheduled alert check");
    await checkAlerts();
  } catch (error) {
    log.error("Scheduled alert check failed", error);
  }
});

app.listen(config.port, () => {
  log.info(`Server running on port ${config.port}`);
});
