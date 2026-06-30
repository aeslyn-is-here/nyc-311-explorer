const mongoose = require("mongoose");

const alertRuleSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

const AlertRule = mongoose.model("AlertRule", alertRuleSchema);

module.exports = AlertRule;