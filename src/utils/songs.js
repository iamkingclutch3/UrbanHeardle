import axios from "axios";

const songs = [];

export const getRandomSong = () => {
  if (songs.length === 0) return null;
  return songs[Math.floor(Math.random() * songs.length)];
};

async function fetchSongs(hostname, limit, offset) {
  try {
    const response = await axios({
      method: "get",
      url: `http${hostname == "localhost" ? "" : "s"}://${hostname}${
        hostname == "localhost" ? ":5240" : ""
      }${
        hostname == "localhost" ? "" : "/api"
      }/songs?limit=${limit}&offset=${offset}`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Add any other headers you might need
      },
      // Timeout configuration
      timeout: 50000, // 5 seconds timeout
      // You can add response type if needed
      responseType: "json",
    });

    const songData = response.data;
    return songData;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        "Error response:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error:", error.message);
    }
    throw error; // Re-throw the error if you want the caller to handle it
  }
}

export const loadSongs = async (limit = 50, offset = 0) => {
  const hostname = window.location.hostname;

  try {
    const songData = await fetchSongs(hostname, limit, offset);

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
  try {
    const res = await fetch("/songs/songs.json");
    console.log(res);
    const songData = await res.json();

    songs.length = 0;

    for (const entry of songData) {
      songs.push({
        id: entry.file,
        filePath: `/songs/${entry.file}`,
        artist: entry.artist.trim(),
        title: entry.title.trim(),
        coverUrl: entry.coverUrl,
      });
    }

    console.log(`Loaded ${songs.length} songs`);
  } catch (err) {
    console.error("Failed to load songs.json. Trying with API", err);
    let offset = 0;
    const limit = 100;
    let keepLoading = true;

    while (keepLoading) {
      const count = await loadSongs(limit, offset);
      if (!count || count < limit) keepLoading = false;
      offset += limit;
    }
  }
};

export const getAllSongs = () => songs;
