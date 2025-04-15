import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jsmediatags from "jsmediatags";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsDir = path.join(__dirname, "../../public/songs");

const db = new Database(path.join(songsDir, "manifest.db"));

// Create table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    file TEXT UNIQUE,
    coverUrl TEXT
  )
`
).run();

const insertOrReplace = db.prepare(`
  INSERT OR REPLACE INTO songs (title, artist, file, coverUrl)
  VALUES (@title, @artist, @file, @coverUrl)
`);

const generateManifest = async (songsDirectory) => {
  const allFiles = fs.readdirSync(songsDirectory);
  const songFiles = allFiles.filter(
    (file) => path.extname(file).toLowerCase() === ".mp3"
  );

  // Get already processed files to skip them
  const existingFiles = db
    .prepare("SELECT file FROM songs")
    .all()
    .map((row) => row.file);
  const existingSet = new Set(existingFiles);

  const newSongs = songFiles.filter((file) => !existingSet.has(file));
  console.log(
    `Found ${songFiles.length} mp3 files, ${newSongs.length} new to process.`
  );

  const tasks = newSongs.map(async (songFile) => {
    try {
      const [artist, ...titleParts] = songFile.replace(".mp3", "").split(" - ");
      const title = titleParts.join(" - ");
      const coverUrl = await extractCoverImage(
        path.join(songsDirectory, songFile)
      );

      const song = {
        title: title.trim(),
        artist: artist.trim() || "Unknown Artist",
        file: songFile,
        coverUrl,
      };

      insertOrReplace.run(song);
    } catch (error) {
      console.error("Error processing file:", songFile, error);
    }
  });

  await Promise.all(tasks);
  console.log("Manifest generation completed.");
};

let cachedPlaceholder = null;
const getPlaceholderImage = () => {
  if (!cachedPlaceholder) {
    const placeholderPath = path.join(
      __dirname,
      "../../public/assets/cover/placeholder-cover.jpg"
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

function init() {
  generateManifest(songsDir);
}

export default init;
