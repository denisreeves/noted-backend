const express = require("express");
const Note = require("../models/Note");
const { encryptData, decryptData } = require("../utils/encryption");

const router = express.Router();

// 📝 Create a new note
router.post("/add", async (req, res) => {
  try {
    const { userId, title, content, tag, reminderTime } = req.body;

    // Validate input
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required!" });
    }

    console.log("Received Title:", title); 
    console.log("Received Content:", content);

    // Encrypt title and content
    const encryptedTitle = encryptData(title);
    const encryptedContent = encryptData(content);

    console.log("Encrypted Title:", encryptedTitle);
    console.log("Encrypted Content:", encryptedContent);

    const newNote = new Note({
      userId,
      title: encryptedTitle,
      content: encryptedContent,
      tag,
      reminderTime,
    });

    await newNote.save();

    // 🔓 Decrypt before returning the response
    const decryptedNote = {
      _id: newNote._id,
      userId: newNote.userId,
      title: decryptData(newNote.title),
      content: decryptData(newNote.content),
      tag: newNote.tag,
      reminderTime: newNote.reminderTime,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
    };

    res.status(201).json(decryptedNote);
  } catch (err) {
    console.error("Error saving note:", err);
    res.status(500).json({ error: err.message });
  }
});


// 📄 Fetch all notes for a user
router.get("/:userId", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    const decryptedNotes = notes.map(note => ({
      _id: note._id,
      userId: note.userId,
      title: decryptData(note.title),  // 🔐 Decrypt title
      content: decryptData(note.content), // 🔐 Decrypt content
      tag: note.tag,
      reminderTime: note.reminderTime,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));

    res.json(decryptedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/test", async (req, res) => {
  try {
    const text = "Hello world";
    const encryptedTitle = encryptData(text);
    
    console.log("🔐 Encrypted:", encryptedTitle); // Check if encryption returns a value
    
    const decryptedTitle = decryptData(encryptedTitle);
    
    console.log("🔓 Decrypted:", decryptedTitle); // Ensure it properly decrypts
    
    res.json({ encryptedTitle, decryptedTitle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✏️ Update a note
router.put("/:id", async (req, res) => {
  try {
    const { title, content, tag, reminderTime } = req.body;

    // Encrypt before saving
    const encryptedTitle = encryptData(title);
    const encryptedContent = encryptData(content);

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        title: encryptedTitle, 
        content: encryptedContent, 
        tag, 
        reminderTime
      },
      { new: true }
    );
    const decryptedNote = {
      _id: updatedNote._id,
      userId: updatedNote.userId,
      title: decryptData(updatedNote.title),
      content: decryptData(updatedNote.content),
      tag: updatedNote.tag,
      reminderTime: updatedNote.reminderTime,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
    };

    res.json(decryptedNote);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🗑️ Delete a note
router.delete("/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
