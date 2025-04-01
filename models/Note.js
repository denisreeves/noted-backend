const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Firebase Auth UID
    title: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, default: null },
    reminderTime: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", NoteSchema);
