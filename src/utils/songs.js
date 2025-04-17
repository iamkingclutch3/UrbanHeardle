export const getRandomSong = async () => {
  const hostname = window.location.hostname;

  try {
    const url = `http${hostname === "localhost" ? "" : "s"}://${hostname}${
      hostname === "localhost" ? ":5240" : ""
    }${hostname === "localhost" ? "" : "/api"}/songs/random`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.json();
    const songData = responseData.song;

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
    const url = `http${hostname === "localhost" ? "" : "s"}://${hostname}${
      hostname === "localhost" ? ":5240" : ""
    }${hostname === "localhost" ? "" : "/api"}/songs/list`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.json();
    const songData = responseData.songs;

    return songData;
  } catch (error) {
    console.error("Error fetching song list:", error);
    return [];
  }
};
