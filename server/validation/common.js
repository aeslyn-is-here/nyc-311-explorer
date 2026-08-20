const { z } = require("zod");
const mongoose = require("mongoose");
const { isValidZip } = require("../utils/validation");

// Reused by every route that accepts a zip — keeps the actual rule
// (isValidZip, already unit-tested) as the single source of truth;
// this just wires it into a zod schema.
const zipSchema = z
  .string({ error: "ZIP code is required" })
  .refine(isValidZip, "ZIP code must be 5 digits");

const mongoIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid ID");

module.exports = { zipSchema, mongoIdSchema };
