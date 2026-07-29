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

module.exports = log;
