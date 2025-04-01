require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const noteRoutes = require("./routes/noteRoutes");
const backupRoutes = require("./routes/backupRoute");
const backupJob = require("./jobs/backupJob"); // ✅ Import the backup job
const backupFileRoutes = require("./routes/backupFileRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const path = require("path");
const fs = require("fs");
const Backup = require("./models/Backup");


const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI,)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/notes", noteRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/backups", backupFileRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/backups", express.static(path.join(__dirname, "backups")));

// Start the backup job

// backupJob();

// Endpoint to Send Email
app.post("/send-email", async (req, res) => {
  const { smtpEmail, smtpPassword, smtpHost, smtpPort, recipientEmail, subject, message } = req.body;

  if (!smtpEmail || !smtpPassword || !smtpHost || !smtpPort || !recipientEmail || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Create transporter
  let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort == 465, // True for 465, false for 587/25
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const mailOptions = {
    from: smtpEmail,
    to: recipientEmail,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "📨 Email sent successfully!" });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    res.status(500).json({ error: "❌ Failed to send email." });
  }
});

// const deleteAllBackups = async () => {
//   try {
//     await Backup.deleteMany({});
//     console.log("✅ All backups deleted successfully!");
//   } catch (error) {
//     console.error("❌ Failed to delete backups:", error);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// deleteAllBackups();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));