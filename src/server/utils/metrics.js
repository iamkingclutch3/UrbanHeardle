import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../../public/manifest.db");

const db = new Database(dbPath, { readonly: true });

export function getLibraryMetrics() {
  const songs = db.prepare("SELECT * FROM songs").all();

  const totalSongs = songs.length;
  const artistCounts = {};
  let missingMetadata = 0;

  songs.forEach(({ artist, title }) => {
    const cleanArtist = artist?.trim() || "Unknown Artist";
    const cleanTitle = title?.trim() || "";

    if (!cleanTitle || !cleanArtist || cleanArtist === "Unknown Artist") {
      missingMetadata++;
    }

    if (!artistCounts[cleanArtist]) {
      artistCounts[cleanArtist] = 0;
    }
    artistCounts[cleanArtist]++;
  });

  const sortedArtists = Object.entries(artistCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const mostFrequentArtist = sortedArtists[0];
  const uniqueArtists = Object.keys(artistCounts).length;

  const artistPercentages = sortedArtists.map(([artist, count]) => ({
    artist,
    count,
    percentage: ((count / totalSongs) * 100).toFixed(2) + "%",
  }));

  return {
    totalSongs,
    uniqueArtists,
    mostFrequentArtist: {
      artist: mostFrequentArtist?.[0] || "Unknown",
      count: mostFrequentArtist?.[1] || 0,
    },
    missingMetadata,
    topArtists: artistPercentages.slice(0, 10),
  };
}
