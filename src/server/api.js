import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import genManifest from "./generateManifest.js";
import { getLibraryMetrics } from "./metrics.js";
import compression from "compression";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../public/songs/manifest.db");

const db = new Database(dbPath);
const app = express();
const PORT = 5240; // No 3000 or 7000

let cachedSongs = null;

app.use(cors());
app.use(compression());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/songs/list", (req, res) => {
  try {
    if (!cachedSongs) {
      cachedSongs = db.prepare("SELECT title, artist FROM songs").all();
    }

    res.json({
      songs: cachedSongs.map((song) => ({
        title: song.title,
        artist: song.artist,
      })),
    });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/songs/random", (req, res) => {
  try {
    if (!cachedSongs) {
      cachedSongs = db
        .prepare("SELECT title, artist, file, coverUrl FROM songs")
        .all();
      console.log(`Cached ${cachedSongs.length} songs`);
    }

    if (cachedSongs.length === 0) {
      return res.status(404).json({ error: "No songs available" });
    }

    const randomSong =
      cachedSongs[Math.floor(Math.random() * cachedSongs.length)];

    res.json({ song: randomSong });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/songs", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (!cachedSongs) {
    try {
      cachedSongs = db
        .prepare("SELECT title, artist, file, coverUrl FROM songs")
        .all();
      console.log(`Cached ${cachedSongs.length} songs`);
    } catch (err) {
      console.error("DB Error:", err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const pagedSongs = cachedSongs.slice(offset, offset + limit);
  res.json({ songs: pagedSongs });
});

app.get("/metrics", (req, res) => {
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
      `Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}
