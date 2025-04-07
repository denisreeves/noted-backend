const crypto = require("crypto");

// ✅ Generate a 32-byte AES key correctly
const secretKey = crypto.createHash("sha256").update("your-secure-key").digest(); // No slicing!

const algorithm = "aes-256-cbc";

// 🔐 Encrypt Function
const encryptData = (text) => {
  if (!text) return ""; // Prevent undefined encryption

  const iv = crypto.randomBytes(16); // Unique IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv); // ✅ Fixed key usage
  
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted; // Store IV with encrypted text
};

// 🔓 Decrypt Function
const decryptData = (encryptedText) => {
  try {
    if (!encryptedText.includes(":")) throw new Error("Invalid encrypted format");

    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = Buffer.from(parts[1], "hex");

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv); // ✅ Fixed key usage
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error:", err.message);
    return "Decryption failed"; // Handle error gracefully
  }
};

module.exports = { encryptData, decryptData };
