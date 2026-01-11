const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  customerEmail: {
    type: String,
    required: true,
  },
  billingMonth: {
    type: String,
    required: true,
  },
  unitsConsumed: {
    type: Number,
    required: true,
  },
  ratePerUnit: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Unpaid", "Paid"],
    default: "Unpaid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Bill", billSchema);
