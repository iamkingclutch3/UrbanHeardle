import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../../public/manifest.db");
const db = new Database(dbPath);

const router = express.Router();

let cachedSongs = null;
let shuffledPlaylist = [];
let currentIndex = 0;
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
      shuffledPlaylist = shuffle([...cachedSongs]);
    }

    if (cachedSongs.length === 0) {
      return res.status(404).json({ error: "No songs available" });
    }

    const requestedArtist = req.query.artist?.toLowerCase();

    let nextSong = null;

    if (requestedArtist) {
      // Filter songs by artist only (no shuffling in this case)
      const artistSongs = cachedSongs.filter(
        (song) => song.artist.toLowerCase() === requestedArtist
      );

      const availableArtistSongs = artistSongs.filter(
        (song) => !recentlyPlayed.includes(song.file)
      );

      if (availableArtistSongs.length === 0) {
        return res.status(404).json({
          error: `No non-recent songs available for artist: ${requestedArtist}`,
        });
      }

      nextSong =
        availableArtistSongs[
          Math.floor(Math.random() * availableArtistSongs.length)
        ];
    } else {
      // Pick next from shuffled playlist
      while (currentIndex < shuffledPlaylist.length) {
        const candidate = shuffledPlaylist[currentIndex];
        currentIndex++;

        if (!recentlyPlayed.includes(candidate.file)) {
          nextSong = candidate;
          break;
        }
      }

      // All songs exhausted or recently played, reshuffle
      if (!nextSong) {
        shuffledPlaylist = shuffle([...cachedSongs]);
        currentIndex = 0;
        nextSong = shuffledPlaylist[currentIndex++];
      }
    }

    recentlyPlayed.unshift(nextSong.file);
    if (recentlyPlayed.length > 200) {
      recentlyPlayed.pop();
    }

    console.log(`Selected: ${nextSong.title} by ${nextSong.artist}`);

    res.json({ song: nextSong });
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

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

export default router;
