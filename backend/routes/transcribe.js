// backend/routes/transcribe.js
const express = require("express");
const multer = require("multer");
const upload = multer(); // memory storage -> req.file.buffer
const router = express.Router();
const fs = require("fs");
const os = require("os");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const filename = req.file.originalname || "audio.m4a";
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
    await fs.promises.writeFile(tmpPath, req.file.buffer);

    // whisper-1 (or gpt-4o-transcribe if enabled on your account)
    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "whisper-1",
      // language: "en",
    });

    await fs.promises.unlink(tmpPath).catch(() => {});
    res.json({ text: result.text || "" });
  } catch (e) {
    console.error("transcribe error", e);
    res.status(500).json({ error: "transcription_failed" });
  }
});

module.exports = router;
