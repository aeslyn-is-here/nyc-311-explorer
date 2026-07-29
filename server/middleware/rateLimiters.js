const rateLimit = require("express-rate-limit");

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

module.exports = { authLimiter, apiLimiter };
