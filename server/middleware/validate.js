// Applies a zod schema to an incoming request's body/query/params at the
// route boundary, before any handler code runs. On success, the (possibly
// transformed — e.g. trimmed, lowercased) values are written back onto
// req.body/req.query/req.params so downstream code sees the clean version.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request";
    return res.status(400).json({ error: message });
  }

  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

module.exports = validate;
