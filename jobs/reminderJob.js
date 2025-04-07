// reminderCron.js
const cron = require("node-cron");
const Reminder = require("../models/Reminder"); // Assuming you have a Reminder model
const { sendEmail } = require("../emailService");

cron.schedule("* * * * *", async () => {
  try {
    const reminders = await Reminder.find({
      reminderTime: { $lte: new Date() },
      notified: false,
    });

    reminders.forEach((reminder) => {
      sendEmail(reminder.userId, "Reminder: " + reminder.message, reminder.message);

      reminder.notified = true;
      reminder.save();
    });
  } catch (error) {
    console.error("Error checking reminders:", error);
  }
});