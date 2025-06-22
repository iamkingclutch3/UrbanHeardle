import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../../public/manifest.db");
const db = new Database(dbPath);

const router = express.Router();
let cachedSongs = null;

let recentlyPlayed = [];

router.get("/list", (req, res) => {
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

router.get("/random", (req, res) => {
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

    const requestedArtist = req.query.artist;

    let filteredSongs = cachedSongs.filter(
      (song) => !recentlyPlayed.some((played) => played == song.file)
    );

    // If an artist is specified, filter the songs
    if (requestedArtist) {
      filteredSongs = cachedSongs.filter(
        (song) => song.artist.toLowerCase() === requestedArtist.toLowerCase()
      );

      if (filteredSongs.length === 0) {
        return res.status(404).json({
          error: `No songs available for artist: ${requestedArtist}`,
        });
      }
    }

    const randomSong =
      filteredSongs[Math.floor(Math.random() * filteredSongs.length)];

    randomSong.file = randomSong.file;

    // Add song to recently played list
    recentlyPlayed.unshift(randomSong.file);

    if (recentlyPlayed.length > 100) {
      recentlyPlayed.pop(); // Keep only the last 10 songs
    }

    res.json({ song: randomSong });
  } catch (err) {
    console.error("DB Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", (req, res) => {
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

function getSafeFilePath(filename) {
  const a = encodeURI(filename)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  console.log("Filename: ", filename, "Encoded: ", a);
  return a;
}

export default router;
