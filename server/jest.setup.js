// Runs before any test file's code, so config/index.js's required-env-var
// check (which calls process.exit(1) if anything is missing) always finds
// these dummy values present during tests, no real .env needed.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test";
process.env.NYC_311_API_URL =
  process.env.NYC_311_API_URL || "https://example.test/nyc-311";
process.env.CRON_SECRET = process.env.CRON_SECRET || "test-cron-secret";
// Not in config's REQUIRED_ENV_VARS (email is an optional feature), but
// services/notifications/email.js still constructs its Resend client at
// module-load time, so it needs *some* value to avoid crashing on require.
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_dummy_key";
