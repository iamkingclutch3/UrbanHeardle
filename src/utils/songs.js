const songs = [];

export const getRandomSong = () => {
  if (songs.length === 0) return null;
  return songs[Math.floor(Math.random() * songs.length)];
};

export const loadSongs = async () => {
  const hostname = window.location.hostname;
  try {
    console.log(
      `http://${hostname}${hostname == "localhost" ? ":5240" : ""}/api/songs`
    );
    const res = await fetch(
      `http://${hostname}${hostname == "localhost" ? ":5240" : ""}/api/songs`
    );
    const songData = await res.json();

    songs.length = 0; // Clear existing songs

    for (const entry of songData.songs) {
      songs.push({
        id: entry.file,
        filePath: `/songs/${entry.file}`,
        artist: entry.artist.trim(),
        title: entry.title.trim(),
        coverUrl: entry.coverUrl, // Placeholder for metadata
      });
    }
  } catch (error) {
    console.error("Error loading songs:", error);
  }
};

export const getAllSongs = () => songs;
