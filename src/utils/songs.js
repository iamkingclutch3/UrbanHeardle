import axios from "axios";

export const getRandomSong = async () => {
  const hostname = window.location.hostname;

  try {
    const response = await axios({
      method: "get",
      url: `http${hostname == "localhost" ? "" : "s"}://${hostname}${
        hostname == "localhost" ? ":5240" : ""
      }${hostname == "localhost" ? "" : "/api"}/songs/random`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 5000,
      responseType: "json",
    });

    const songData = response.data.song;

    return {
      filePath: `/songs/${songData.file}`,
      artist: songData.artist?.trim() || "Unknown Artist",
      title: songData.title?.trim() || "Unknown Title",
      coverUrl: songData.coverUrl,
    };
  } catch (error) {
    if (error.response) {
      console.error(
        "Error response:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
};

export const getSongList = async () => {
  const hostname = window.location.hostname;

  try {
    const response = await axios({
      method: "get",
      url: `http${hostname == "localhost" ? "" : "s"}://${hostname}${
        hostname == "localhost" ? ":5240" : ""
      }${hostname == "localhost" ? "" : "/api"}/songs/list`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 5000,
      responseType: "json",
    });

    const songData = response.data.songs;

    return songData;
  } catch (error) {
    console.error("Error fetching song list:", error);
    return [];
  }
};
