const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment"); // MongoDB model
require("dotenv").config();

const router = express.Router();

// ✅ Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/** ✅ CREATE ORDER (One-Time Payment) */
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // ✅ Check if the user has already made a successful payment
    const existingPayment = await Payment.findOne({ userId });
    if (existingPayment) {
      return res.json({ success: false, message: "User already has access." });
    }

    // ✅ Create Razorpay Order
    const options = {
      amount: amount * 100, // Convert amount to paise
      currency,
      receipt: `rcpt_${userId.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", order);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
});

/** ✅ VERIFY PAYMENT */
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    // ✅ Validate Signature
    const hmac = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (hmac !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed!" });
    }

    // ✅ Save Payment to MongoDB (Ensure atomicity)
    const payment = new Payment({
      userId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      filePath: null, // Future backups?
      createdAt: new Date(),
      status: "success",
    });

    await payment.save();

    res.json({ success: true, message: "Payment verified. Dashboard access granted!" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
});

/** ✅ CHECK IF USER HAS ACCESS */
router.get("/check-access/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const payment = await Payment.findOne({ userId });

    if (!payment) {
      return res.json({ hasAccess: false });
    }

    if (payment.status === "success") {
      return res.json({ hasAccess: true });
    }

    if (payment.status === "trial") {
      const now = new Date();
      if (payment.trialEndsAt && payment.trialEndsAt > now) {
        return res.json({ hasAccess: true, trial: true, trialEndsAt: payment.trialEndsAt });
      }
    }

    res.json({ hasAccess: false });
  } catch (error) {
    console.error("❌ Error checking access:", error);
    res.status(500).json({ success: false, message: "Error checking access", error: error.message });
  }
});


router.post("/start-trial/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log
  if (!userId) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  try {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const existing = await Payment.findOne({ userId });

    // If user has already started a trial or paid
    if (existing) {
      if (existing.status === "success") {
        return res.json({ success: false, message: "User already has full access." });
      }
      if (existing.status === "trial" && existing.trialEndsAt > now) {
        return res.json({ success: true, message: "Trial already active", trialEndsAt: existing.trialEndsAt });
      }
    }

    // Upsert the trial entry
    await Payment.findOneAndUpdate(
      { userId },
      {
        userId,
        status: "trial",
        trialStarted: now,
        trialEndsAt,
        createdAt: now,
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Trial started", trialEndsAt });
  } catch (error) {
    console.error("Error starting trial:", error);
    res.status(500).json({ success: false, message: "Error starting trial", error: error.message });
  }
});
module.exports = router;