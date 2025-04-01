const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase UID
  razorpayOrderId: String,
  razorpayPaymentId: String,
  filePath: String, // Optional, for future backups
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);
