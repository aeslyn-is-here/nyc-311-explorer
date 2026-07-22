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
      maxlength: 5,
    },
    complaintType: {
      type: String,
      required: true,
      maxlength: 100,
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