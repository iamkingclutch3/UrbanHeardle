import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jsmediatags from "jsmediatags";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsDir = path.join(__dirname, "../../../public/songs");

const db = new Database(path.join(songsDir, "../manifest.db"));

// Create table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    file TEXT UNIQUE,
    coverUrl TEXT,
    popularity INTEGER,
    modified INTEGER
  )
`
).run();

db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_file ON songs(file)").run();

const insertOrReplace = db.prepare(`
  INSERT OR REPLACE INTO songs (title, artist, file, coverUrl, popularity, modified)
  VALUES (@title, @artist, @file, @coverUrl, @popularity, @modified)
`);

let cachedPlaceholder = null;
const getPlaceholderImage = () => {
  if (!cachedPlaceholder) {
    const placeholderPath = path.join(
      __dirname,
      "../../../public/assets/cover/placeholder-cover.jpg"
    );
    const placeholderImage = fs.readFileSync(placeholderPath);
    cachedPlaceholder = `data:image/jpeg;base64,${placeholderImage.toString(
      "base64"
    )}`;
  }
  return cachedPlaceholder;
};

const extractCoverImage = async (songPath) => {
  return new Promise((resolve) => {
    jsmediatags.read(songPath, {
      onSuccess: (tag) => {
        const picture = tag.tags.picture;
        if (picture) {
          const base64Image = `data:${picture.format};base64,${Buffer.from(
            picture.data
          ).toString("base64")}`;
          resolve(base64Image);
        } else {
          resolve(getPlaceholderImage());
        }
      },
      onError: () => {
        resolve(getPlaceholderImage());
      },
    });
  });
};

// Helper to get Spotify API access token (Client Credentials Flow)
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function getPopularityFromSpotify(artist, title, accessToken) {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const url = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const track = data.tracks && data.tracks.items && data.tracks.items[0];
    if (!track || typeof track.popularity !== "number") return 0;
    // Map Spotify popularity (0-100) to 0-10
    return Math.round(track.popularity);
  } catch {
    return 0;
  }
}

const processFile = async (songFile, songsDirectory, existingMap, accessToken) => {
  try {
    const fullPath = path.join(songsDirectory, songFile);
    const stats = fs.statSync(fullPath);
    const modified = Math.floor(stats.mtimeMs);

    const dbEntry = existingMap.get(songFile);
    if (dbEntry && dbEntry.modified === modified) {
      // No changes, skip tag parsing
      return;
    }

    const [artist, ...titleParts] = songFile.replace(".mp3", "").split(" - ");
    const title = titleParts.join(" - ");
    const coverUrl = await extractCoverImage(fullPath);

    // Get popularity from Spotify
    let popularity = 0;
    if (artist && title) {
      popularity = await getPopularityFromSpotify(artist.trim(), title.trim(), accessToken);
    }

    const song = {
      title: title.trim(),
      artist: artist.trim() || "Unknown Artist",
      file: songFile,
      coverUrl,
      popularity,
      modified,
    };

    insertOrReplace.run(song);
  } catch (err) {
    console.error("Error processing file:", songFile, err);
  }
};

// Throttled concurrent processing
const processWithLimit = async (files, limit, songsDirectory, existingMap, accessToken) => {
  let index = 0;

  const next = async () => {
    if (index >= files.length) return;
    const current = index++;
    await processFile(files[current], songsDirectory, existingMap, accessToken);
    return next();
  };

  const workers = [];
  for (let i = 0; i < limit; i++) {
    workers.push(next());
  }

  await Promise.all(workers);
};

const generateManifest = async (songsDirectory, concurrency = 10) => {
  const allFiles = fs.readdirSync(songsDirectory);
  const songFiles = allFiles.filter(
    (file) => path.extname(file).toLowerCase() === ".mp3"
  );

  // Fetch existing DB entries
  const existingEntries = db.prepare("SELECT file, modified FROM songs").all();

  // Create map for quick access
  const existingMap = new Map(existingEntries.map((row) => [row.file, row]));

  // Identify removed files (present in DB but missing from FS)
  const currentFileSet = new Set(songFiles);
  const deletedFiles = existingEntries
    .filter((row) => !currentFileSet.has(row.file))
    .map((row) => row.file);

  // Delete them from DB
  if (deletedFiles.length > 0) {
    const deleteStmt = db.prepare("DELETE FROM songs WHERE file = ?");
    const deleteMany = db.transaction((files) => {
      for (const file of files) deleteStmt.run(file);
    });
    deleteMany(deletedFiles);
    console.log(`Removed ${deletedFiles.length} deleted song(s) from DB.`);
  }

  // Get Spotify access token once
  const accessToken = await getSpotifyAccessToken();

  // Process new or changed songs
  const newOrChangedSongs = songFiles.filter((file) => {
    const fullPath = path.join(songsDirectory, file);
    const stats = fs.statSync(fullPath);
    const modified = Math.floor(stats.mtimeMs);
    const existing = existingMap.get(file);
    return !existing || existing.modified !== modified;
  });

  console.log(
    `Found ${songFiles.length} mp3 files, ${newOrChangedSongs.length} need (re)processing...`
  );

  await processWithLimit(
    newOrChangedSongs,
    concurrency,
    songsDirectory,
    existingMap,
    accessToken
  );

  console.log("Manifest generation completed.");
};

function init() {
  generateManifest(songsDir); // You can pass a second arg to limit concurrency if needed
}

export default init;
