const { z } = require("zod");
const { isValidEmail, isStrongPassword } = require("../utils/validation");

const registerSchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).trim().min(1, "Name is required"),
    email: z
      .string({ error: "Email is required" })
      .trim()
      .toLowerCase()
      .refine(isValidEmail, "Enter a valid email address"),
    password: z
      .string({ error: "Password is required" })
      .refine(
        isStrongPassword,
        "Password must be at least 8 characters and include a letter and a number"
      ),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ error: "Email is required" }).trim().toLowerCase(),
    password: z.string({ error: "Password is required" }),
  }),
});

module.exports = { registerSchema, loginSchema };
