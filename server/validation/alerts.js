const { z } = require("zod");
const { zipSchema, mongoIdSchema } = require("./common");

// POST /api/alerts previously never actually checked zip's format (only
// that it was present) — using the shared zipSchema here closes that gap.
const createAlertSchema = z.object({
  body: z.object({
    zip: zipSchema,
    complaintType: z
      .string({ error: "Complaint type is required" })
      .trim()
      .min(1, "Complaint type is required"),
    threshold: z.number().optional(),
  }),
});

// DELETE/PATCH /api/alerts/:id previously passed :id straight to Mongoose
// with no format check — a malformed id would throw a CastError, caught
// by the generic error handler as an opaque 500 instead of a clean 400.
const alertIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});

const updateAlertSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    isActive: z.boolean({ error: "isActive must be true or false" }),
  }),
});

module.exports = { createAlertSchema, alertIdParamSchema, updateAlertSchema };
