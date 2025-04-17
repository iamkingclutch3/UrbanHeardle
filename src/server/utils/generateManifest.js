import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jsmediatags from "jsmediatags";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsDir = path.join(__dirname, "../../../public/songs");

const db = new Database(path.join(songsDir, "../manifest.db"));

db.prepare("CREATE INDEX IF NOT EXISTS idx_songs_file ON songs(file)").run();

// Create table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    file TEXT UNIQUE,
    coverUrl TEXT,
    modified INTEGER
  )
`
).run();

const insertOrReplace = db.prepare(`
  INSERT OR REPLACE INTO songs (title, artist, file, coverUrl, modified)
  VALUES (@title, @artist, @file, @coverUrl, @modified)
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

const processFile = async (songFile, songsDirectory, existingMap) => {
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

    const song = {
      title: title.trim(),
      artist: artist.trim() || "Unknown Artist",
      file: songFile,
      coverUrl,
      modified,
    };

    insertOrReplace.run(song);
  } catch (err) {
    console.error("Error processing file:", songFile, err);
  }
};

// Throttled concurrent processing
const processWithLimit = async (files, limit, songsDirectory, existingMap) => {
  let index = 0;

  const next = async () => {
    if (index >= files.length) return;
    const current = index++;
    await processFile(files[current], songsDirectory, existingMap);
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
    existingMap
  );

  console.log("Manifest generation completed.");
};

function init() {
  generateManifest(songsDir); // You can pass a second arg to limit concurrency if needed
}

export default init;
