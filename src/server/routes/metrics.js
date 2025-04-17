import express from "express";
import { getLibraryMetrics } from "../utils/metrics.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const metricsData = getLibraryMetrics();
    res.json(metricsData);
  } catch (err) {
    console.error("Metrics Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
