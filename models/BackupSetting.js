const mongoose = require("mongoose");

const BackupSettingSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String },
  frequency: { type: String, enum: ["never", "daily", "weekly", "monthly"], default: "never" },
  lastBackup: { type: Date, default: null },
});

module.exports = mongoose.model("BackupSetting", BackupSettingSchema);