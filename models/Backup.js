const mongoose = require("mongoose");

const BackupSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  filePath: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Backup", BackupSchema);
