const express = require("express");
const { sendEmail } = require("../emailService");
const Reminder = require("../models/Reminder");
const cron = require("node-cron");

const router = express.Router();

// ✅ CREATE REMINDER
router.post("/create-reminder", async (req, res) => {
  console.log("📥 POST /create-reminder called");
  try {
    const { userId, message, reminderTime } = req.body;
    console.log("➡️ Request Body:", req.body);

    if (!userId || !message || !reminderTime) {
      console.warn("⚠️ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "User ID, message, and reminder time are required.",
      });
    }

    const reminder = new Reminder({
      userId,
      message,
      reminderTime,
      notified: false,
    });

    await reminder.save();
    console.log("✅ Reminder saved to DB:", reminder);

    res.json({ success: true, message: "Reminder created successfully!", reminder });
  } catch (error) {
    console.error("❌ Error creating reminder:", error);
    res.status(500).json({ success: false, message: "Error creating reminder", error: error.message });
  }
});

// ✅ GET ALL REMINDERS
router.get("/get-reminders", async (req, res) => {
  console.log("📥 GET /get-reminders called");
  try {
    const reminders = await Reminder.find();
    console.log(`✅ Retrieved ${reminders.length} reminders`);
    res.json({ success: true, reminders });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error);
    res.status(500).json({ success: false, message: "Error fetching reminders", error: error.message });
  }
});

// ✅ MARK REMINDER AS NOTIFIED
router.put("/mark-notified/:id", async (req, res) => {
  console.log(`📥 PUT /mark-notified/${req.params.id} called`);
  try {
    const { id } = req.params;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      console.warn("⚠️ Reminder not found with ID:", id);
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    reminder.notified = true;
    await reminder.save();
    console.log("✅ Reminder marked as notified:", id);

    res.json({ success: true, message: "Reminder marked as notified" });
  } catch (error) {
    console.error("❌ Error updating reminder:", error);
    res.status(500).json({ success: false, message: "Error updating reminder", error: error.message });
  }
});

// ✅ CRON JOB TO SEND REMINDER EMAILS
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    now.setSeconds(0, 0); // Truncate to the exact minute

    //console.log("⏰ Cron job running at:", new Date().toISOString());
    //console.log("🔍 Checking for reminders due before:", now.toISOString());

    // 🔍 Find all reminders due or overdue and not yet notified
    const reminders = await Reminder.find({
      reminderTime: { $lte: now },
    });

    if (reminders.length === 0) {
      //console.log("📭 No reminders to send at this time.");
    }

    for (const reminder of reminders) {
      console.log(`📬 Sending reminder to: ${reminder.userId}`);
      const emailSubject = "Reminder from Noted: " + reminder.message;
      const emailBody = `
        <p>Hi there,</p>
        <p>This is a friendly reminder from <strong>Noted</strong> regarding:</p>
        <blockquote style="margin: 12px 0; padding: 12px; background: #f9f9f9; border-left: 4px solid #ccc;">
          ${reminder.message}
        </blockquote>
        <p>We hope this helps keep you on track!</p>
        <br/>
        <p>Best regards,<br/>The <strong>Noted</strong> Team</p>
      `;


      await sendEmail(reminder.userId, emailSubject, emailBody);

      // ✅ Delete the reminder after successful email
      await Reminder.findByIdAndDelete(reminder._id);
      //console.log(`🗑️ Reminder sent and deleted: ${reminder._id}`);
    }

    

  } catch (error) {
    console.error("❌ Error checking reminders:", error);
  }
});



module.exports = router;
