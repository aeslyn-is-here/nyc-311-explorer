const { z } = require("zod");
const { zipSchema } = require("./common");

const complaintTypeRequired = z
  .string({ error: "Complaint type is required" })
  .trim()
  .min(1, "Complaint type is required");

const statsQuerySchema = z.object({
  query: z.object({
    zip: zipSchema,
    complaintType: complaintTypeRequired,
  }),
});

const trendQuerySchema = z.object({
  query: z.object({
    zip: zipSchema,
    complaintType: complaintTypeRequired,
  }),
});

// complaintType is optional here — a plain ZIP search with no filter is
// a valid use case for this route, unlike /stats and /trend.
const complaintsQuerySchema = z.object({
  query: z.object({
    zip: zipSchema,
    complaintType: z.string().trim().optional(),
  }),
});

module.exports = { statsQuerySchema, trendQuerySchema, complaintsQuerySchema };
