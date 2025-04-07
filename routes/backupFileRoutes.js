const express = require("express");
const Backup = require("../models/Backup");
const path = require("path");
const fs = require("fs");



const router = express.Router();

// 📌 Fetch all backups for a user
router.get("/:userId", async (req, res) => {
  try {
    const backups = await Backup.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/delete", async (req, res) => {
  try {
    const { backupId, filePath } = req.body;

    console.log("📝 Received BackupId:", backupId);
    console.log("📝 Received FilePath:", filePath);

    // Ensure backupId is provided
    if (!backupId || !filePath) {
      return res.status(400).json({ success: false, message: "BackupId and FilePath are required." });
    }

    // Find backup in DB
    const backup = await Backup.findById(backupId);
    if (!backup) {
      return res.status(404).json({ success: false, message: "Backup not found in database." });
    }

    // Resolve full file path
    const absolutePath = path.join(__dirname, "..", "backups", path.basename(filePath));
    console.log("🔍 Resolved File Path:", absolutePath);

    // Check if file exists
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log("✅ File deleted successfully.");
    } else {
      console.log("⚠️ File not found:", absolutePath);
    }

    // Delete from database
    await Backup.findByIdAndDelete(backupId);
    console.log("✅ Backup record deleted from DB.");

    return res.json({ success: true, message: "Backup deleted successfully." });
  } catch (error) {
    console.error("🔥 Error deleting backup:", error);
    return res.status(500).json({ success: false, message: "Failed to delete backup." });
  }
});




module.exports = router;
