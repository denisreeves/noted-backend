const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { db } = require("./config/firebase");
const { encryptData } = require("./utils/encryption");

// Fetch users with specific backup frequency
const getUsersByBackupFrequency = async (frequency) => {
  const snapshot = await db.collection("users").where("backupFrequency", "==", frequency).get();
  return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() }));
};

// Create a Backup
const createBackup = async (userId) => {
  try {
    const notesSnapshot = await db.collection("notes").where("userId", "==", userId).get();
    const notes = notesSnapshot.docs.map(doc => doc.data());

    if (notes.length === 0) return;

    const encryptedBackup = encryptData(JSON.stringify(notes));
    const backupPath = path.join(__dirname, `backups/${userId}_backup.json`);
    fs.writeFileSync(backupPath, encryptedBackup);

    console.log(`✅ Backup created for ${userId}`);
  } catch (err) {
    console.error(`❌ Backup failed for ${userId}:`, err.message);
  }
};

// Daily Backup (Runs at 00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running daily backups...");
  const users = await getUsersByBackupFrequency("daily");
  users.forEach(user => createBackup(user.userId));
});

// Weekly Backup (Runs Sunday at 00:00)
cron.schedule("0 0 * * 0", async () => {
  console.log("🔄 Running weekly backups...");
  const users = await getUsersByBackupFrequency("weekly");
  users.forEach(user => createBackup(user.userId));
});

// Monthly Backup (Runs 1st day of the month at 00:00)
cron.schedule("0 0 1 * *", async () => {
  console.log("🔄 Running monthly backups...");
  const users = await getUsersByBackupFrequency("monthly");
  users.forEach(user => createBackup(user.userId));
});
