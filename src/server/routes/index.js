import express from "express";
import songsRouter from "./songs.js";
import feedbackRouter from "./feedback.js";
import metricsRouter from "./metrics.js";
import leaderboard from "./leaderboard.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("API is running!");
});

router.use("/songs", songsRouter);
router.use("/feedback", feedbackRouter);
router.use("/metrics", metricsRouter);
router.use("/leaderboard", leaderboard);

export default router;
