import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import genManifest from "./generateManifest.js";
import { getLibraryMetrics } from "./metrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../public/songs/manifest.db");

const db = new Database(dbPath);
const app = express();
const PORT = 5240; // No 3000 or 7000

app.use(cors());

app.get("/api/songs", (req, res) => {
  try {
    const songs = db
      .prepare("SELECT title, artist, file, coverUrl FROM songs")
      .all();
    res.json({ songs });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/metrics", (req, res) => {
  try {
    const metricsData = getLibraryMetrics();
    res.json(metricsData);
  } catch (err) {
    console.error("Metrics Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export function startServer() {
  genManifest();

  app.listen(PORT, () => {
    console.log(
      `🎵 Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}
