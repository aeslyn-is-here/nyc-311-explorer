const { z } = require("zod");
const { isValidSlackWebhookUrl } = require("../utils/validation");

// Mirrors the User model's notificationMethod enum. Previously this
// route relied entirely on Mongoose's own enum validator (via
// runValidators) to catch a bad value — which throws an uncaught
// ValidationError, landing as an opaque 500 instead of a clean 400.
const NOTIFICATION_METHODS = ["none", "slack", "email", "both"];

const notificationSettingsSchema = z.object({
  body: z.object({
    notificationMethod: z
      .enum(NOTIFICATION_METHODS, {
        error: `notificationMethod must be one of: ${NOTIFICATION_METHODS.join(", ")}`,
      })
      .optional(),
    slackWebhookUrl: z
      .string()
      .optional()
      .refine(
        (url) => !url || isValidSlackWebhookUrl(url),
        "Slack webhook URL must be a valid https://hooks.slack.com/... URL"
      ),
    emailNotificationAddress: z.string().optional(),
  }),
});

module.exports = { notificationSettingsSchema };
