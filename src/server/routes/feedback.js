import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

const feedbackFile = path.join(process.cwd(), "feedback.json");

router.post("/", (req, res) => {
  const { category, message } = req.body;

  if (!category || !message) {
    return res.status(400).json({ error: "Missing category or message." });
  }

  const newFeedback = {
    id: Date.now(),
    category,
    message,
    timestamp: new Date().toISOString(),
  };

  try {
    let feedbackData = [];

    if (fs.existsSync(feedbackFile)) {
      const existing = fs.readFileSync(feedbackFile, "utf8");
      feedbackData = JSON.parse(existing || "[]");
    }

    feedbackData.push(newFeedback);
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbackData, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save feedback:", err);
    res.status(500).json({ error: "Could not save feedback." });
  }
});

export default router;
