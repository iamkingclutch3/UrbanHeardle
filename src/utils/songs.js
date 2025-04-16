const songs = [];

export const getRandomSong = () => {
  if (songs.length === 0) return null;
  return songs[Math.floor(Math.random() * songs.length)];
};

export const loadSongs = async (limit = 50, offset = 0) => {
  const hostname = window.location.hostname;

  try {
    const res = await fetch(
      `http://${hostname}${
        hostname == "localhost" ? ":5240" : ""
      }/api/songs?limit=${limit}&offset=${offset}`
    );
    const songData = await res.json();

    for (const entry of songData.songs) {
      songs.push({
        id: entry.file,
        filePath: `/songs/${entry.file}`,
        artist: entry.artist.trim(),
        title: entry.title.trim(),
        coverUrl: entry.coverUrl,
      });
    }

    return songData.songs.length; // You can use this to stop when no more songs
  } catch (error) {
    console.error("Error loading songs:", error);
  }
};

export const loadAllSongs = async () => {
  let offset = 0;
  const limit = 50;
  let keepLoading = true;

  while (keepLoading) {
    const count = await loadSongs(limit, offset);
    if (!count || count < limit) keepLoading = false;
    offset += limit;
  }
};

export const getAllSongs = () => songs;
