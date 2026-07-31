const log = require("../utils/logger");

// Centralized error handler: Express 5 automatically forwards a rejected
// promise from an async route handler here, so routes no longer need
// their own try/catch-log-500 block — they can just let errors throw.
// Must keep all 4 parameters (including unused `next`) — Express detects
// error-handling middleware specifically by function arity.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  log.error("Unhandled route error", err, {
    method: req.method,
    path: req.path,
  });

  res.status(500).json({ error: "Something went wrong. Please try again." });
};

module.exports = errorHandler;
