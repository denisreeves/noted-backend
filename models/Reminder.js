// Reminder model (Reminder.js)

const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  reminderTime: {
    type: Date,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);
