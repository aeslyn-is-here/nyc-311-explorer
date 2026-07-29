const log = require("../utils/logger");

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

// Reads + validates every env var once, here, so the rest of the app
// never touches process.env directly and always sees a fully-populated
// config object.
const config = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET,
  mongodbUri: process.env.MONGODB_URI,
  nyc311ApiUrl: process.env.NYC_311_API_URL,
  nycAppToken: process.env.NYC_APP_TOKEN,
  cronSecret: process.env.CRON_SECRET,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  // Comma-separated list of allowed frontend origins, e.g.
  // FRONTEND_URL=http://localhost:5173,https://your-app.vercel.app
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
};

module.exports = config;
