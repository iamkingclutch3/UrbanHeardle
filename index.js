import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { startServer } from "./src/server/api.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const songsDir = path.join(__dirname, "public", "songs");

const charsToRemove = /[!#?%&=|,\[\]{}";]/g; ///[!#?%&=|,\[\]{}";]/g;

function sanitizeFilename(filename) {
  return filename.replace(charsToRemove, "");
}

function sanitizeMp3Filenames() {
  try {
    console.log(`Sanitizing MP3 filenames in: ${songsDir}`);

    // Read directory
    const files = fs.readdirSync(songsDir);

    let changedCount = 0;
    let errorCount = 0;

    files.forEach((file) => {
      if (file.endsWith(".mp3")) {
        const originalName = file;
        const cleanName = sanitizeFilename(originalName);

        if (originalName !== cleanName) {
          const originalPath = path.join(songsDir, originalName);
          const cleanPath = path.join(songsDir, cleanName);

          try {
            // Check if the cleaned filename already exists
            if (fs.existsSync(cleanPath)) {
              console.warn(
                `Skipping: "${originalName}" → "${cleanName}" (target exists)`
              );
              return;
            }

            fs.renameSync(originalPath, cleanPath);
            console.log(`Renamed: "${originalName}" → "${cleanName}"`);
            changedCount++;
          } catch (error) {
            console.error(`Error renaming "${originalName}":`, error.message);
            errorCount++;
          }
        }
      }
    });

    console.log(`\nDone. ${changedCount} files renamed, ${errorCount} errors.\n`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

//sanitizeMp3Filenames();

const app = express();
const PORT = 5174;

if (process.platform == "win32") {
  // Local tests
  app.listen(PORT, () => {
    console.log("Running only API");
    startServer(); // Start the API server
  });
} else {
  // Production server
  // Serve static frontend from dist/
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));

  // Handle SPA fallback (for React/Vue Router etc.)
  app.get("/", (req, res, next) => {
    if (req.path.startsWith("/api")) return next(); // skip API
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Main server running at http://localhost:${PORT}`);
    startServer(); // Start the API server
  });
}
