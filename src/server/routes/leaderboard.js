import express from "express";
import { getLeaderboard, saveScore } from "../utils/leaderboard.js";

const router = express.Router();

router.get("/", (req, res) => {
  const leaderboard = getLeaderboard();
  res.json(leaderboard);
});

router.post("/", (req, res) => {
  const { username, score } = req.body;

  if (!username || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid input" });
  }
  saveScore(username, score);
  res.json({ success: true });
});

export default router;
