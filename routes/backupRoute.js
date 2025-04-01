const express = require("express");
const BackupSetting = require("../models/BackupSetting");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// 📌 Save or Update Backup Frequency
router.post("/set-frequency", async (req, res) => {
  try {
    const { userId, userName, frequency } = req.body;

    if (!userId || !frequency) {
      return res.status(400).json({ error: "User ID and frequency are required" });
    }

    const allowedFrequencies = ["never", "daily", "weekly", "monthly"];
    if (!allowedFrequencies.includes(frequency)) {
      return res.status(400).json({ error: "Invalid backup frequency" });
    }

    // Update or insert user backup preference
    const backupSetting = await BackupSetting.findOneAndUpdate(
      { userId },
      { userId, userName, frequency, lastBackup: null },
      { new: true, upsert: true }
    );

    res.json({ message: "Backup preference updated", backupSetting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Get Backup Frequency for a User
router.get("/:userId", async (req, res) => {
  try {
    const backupSetting = await BackupSetting.findOne({ userId: req.params.userId });
    if (!backupSetting) {
      return res.status(404).json({ error: "Backup setting not found" });
    }
    res.json(backupSetting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "../backups", fileName);

  // Check if file exists
  if (fs.existsSync(filePath)) {
      res.download(filePath, fileName); // ⬇️ This forces download
  } else {
      res.status(404).json({ error: "File not found" });
  }
});

module.exports = router;