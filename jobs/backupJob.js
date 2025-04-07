const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { decryptData } = require("../utils/encryption");
const BackupSetting = require("../models/BackupSetting");
const Note = require("../models/Note");
const PDFDocument = require("pdfkit");
const Backup = require("../models/Backup");

const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log("📂 Backup directory created.");
}

const generatePDF = async (userId, userName, notes) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      
      // Generate timestamp: YYYY-MM-DD_HHMMSS
      const timestamp = new Date().toISOString().replace(/[-T:]/g, "_").split(".")[0];

      // File path format: backups/username_YYYY-MM-DD_HHMMSS.pdf
      const fileName = `${userName}_${timestamp}.pdf`;
      const pdfPath = path.join(__dirname, "../backups", fileName);

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // PDF Header
      doc.fontSize(18).text(`Backup for ${userName}`, { align: "center" });
      doc.moveDown();

      // Add decrypted notes
      notes.forEach((note, index) => {
        doc.fontSize(14).text(`📌 Note ${index + 1}: ${note.title}`, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(note.content);
        doc.moveDown(2);
      });

      doc.end();

      stream.on("finish", () => {
        console.log(`✅ PDF successfully created: ${pdfPath}`);

        // ✅ Save Backup Info in Database
        Backup.create({
          userId,
          userName,
          filePath: fileName,
          createdAt: new Date(),
        })
          .then(() => {
            console.log("✅ Backup record saved in database");
            resolve(pdfPath);
          })
          .catch((dbError) => {
            console.error("❌ Failed to save backup in database:", dbError);
            reject(dbError);
          });
      });

      stream.on("error", (err) => {
        console.error("❌ Error writing PDF file:", err);
        reject(err);
      });
    } catch (error) {
      console.error("❌ Unexpected error in generatePDF:", error);
      reject(error);
    }
  });
};


const backupJob = async () => {
  console.log("🔄 Running Backup Task...");

  try {
    const users = await BackupSetting.find({
      frequency: { $in: ["daily", "weekly", "monthly"] },
    });

    if (users.length === 0) {
      console.log("⚠️ No users with backup settings found.");
      return;
    }

    const today = new Date();

    for (const user of users) {
      const lastBackup = user.lastBackup || new Date(0);
      const daysSinceLastBackup = Math.floor((today - lastBackup) / (1000 * 60 * 60 * 24));

      let shouldBackup = false;
      if (user.frequency === "daily") shouldBackup = true;
      if (user.frequency === "weekly" && daysSinceLastBackup >= 7) shouldBackup = true;
      if (user.frequency === "monthly" && daysSinceLastBackup >= 30) shouldBackup = true;

      if (shouldBackup) {
        console.log(`📁 Backing up data for ${user.userName}...`);

        // Fetch and decrypt user notes
        const notes = await Note.find({ userId: user.userId });
        const decryptedNotes = notes.map((note) => ({
          title: decryptData(note.title),
          content: decryptData(note.content),
          createdAt: note.createdAt,
        }));

        if (decryptedNotes.length > 0) {
          const pdfPath = await generatePDF(user.userId, user.userName, decryptedNotes);
          console.log(`✅ Backup saved: ${pdfPath}`);

          // Update last backup date
          await BackupSetting.updateOne({ userId: user.userId }, { lastBackup: new Date() });
        } else {
          console.log(`⚠️ No notes found for ${user.userName}, skipping backup.`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error during backup process:", error);
  }
};

// Schedule backup to run **every day at midnight**
cron.schedule("0 0 * * *", backupJob);

module.exports = backupJob;
