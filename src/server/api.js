import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import genManifest from "./generateManifest.js";
import fs from "fs";
import { getLibraryMetrics } from "./metrics.js";
import compression from "compression";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../public/songs/manifest.db");

const db = new Database(dbPath);
const app = express();
const PORT = 5240; // No 3000 or 7000

const BATCH_SIZE = 500;

let cachedSongs = null;

app.use(cors());
app.use(compression());

app.get("/", (req, res) => {
  res.send("API is running!");
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

  // Cache the songs once on startup
  exportSongsToJson();

  app.listen(PORT, () => {
    console.log(
      `Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}

function exportSongsToJson() {
  try {
    const total = db.prepare("SELECT COUNT(*) AS count FROM songs").get().count;
    const outputPath = path.join(__dirname, "../../dist/songs/songs.json");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const stream = fs.createWriteStream(outputPath);
    stream.write("[\n");

    const select = db.prepare(
      `SELECT title, artist, file, coverUrl FROM songs LIMIT ? OFFSET ?`
    );

    let written = 0;

    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      const batch = select.all(BATCH_SIZE, offset);

      batch.forEach((song, index) => {
        const json = JSON.stringify(song, null, 2);
        const isLast = offset + index + 1 === total;

        stream.write(json + (isLast ? "\n" : ",\n"));
        written++;
      });
    }

    stream.write("]");
    stream.end();

    console.log(`Saved ${written} songs to ${outputPath}`);
  } catch (err) {
    console.error("Failed to save songs.json:", err.message);
  }
}
