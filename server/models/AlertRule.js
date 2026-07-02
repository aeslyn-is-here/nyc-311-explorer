const mongoose = require("mongoose");

const alertRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    complaintType: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
      default: 50,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    currentlyTriggered: {
        type: Boolean,
        required: true,
        default: false,
    },
  },
  {
    timestamps: true,
  }
);

const AlertRule = mongoose.model("AlertRule", alertRuleSchema);

module.exports = AlertRule;