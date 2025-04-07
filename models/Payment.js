const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase UID
  razorpayOrderId: String,
  razorpayPaymentId: String,
  trialStarted: { type: Date, default: null },
  trialEndsAt: { type: Date, default: null },
  filePath: String, // Optional, for future backups
  createdAt: { type: Date, default: Date.now },
  status:String
});

module.exports = mongoose.model("Payment", paymentSchema);
