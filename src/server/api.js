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

let cachedSongs = null;

const allowedOrigins = [
  "http://localhost:5174", // or whatever port Vite/React is using
  "https://povlaoguess.sytes.net",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.options("*", cors());

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

  app.listen(PORT, () => {
    console.log(
      `Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}
