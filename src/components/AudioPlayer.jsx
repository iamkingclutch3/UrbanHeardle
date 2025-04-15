import { useEffect, useRef, useState } from "react";

const AudioPlayer = ({ song, gameState, setGameState, nextStep }) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const barRef = useRef(null);
  const [barWidth, setBarWidth] = useState(0);

  const durations = [1, 2, 4, 7, 11, 16];
  const maxUnlockedDuration = durations[durations.length - 1]; // 16 seconds
  const stepMarkers = durations.map((value, index) => ({
    time: value,
    key: index,
  }));

  // Progress bar
  useEffect(() => {
    if (barRef.current) {
      setBarWidth(barRef.current.offsetWidth);
    }
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Time updates
  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // Game status
  useEffect(() => {
    if (gameState.isRevealed) {
      setGameState((prev) => ({ ...prev, step: durations.length }));
    }
  }, [gameState.isRevealed, setGameState]);

  // Handle play logic
  useEffect(() => {
    const audio = audioRef.current;
    if (gameState.isPlaying) {
      console.debug("Starting playback...");
      audio.currentTime = 0;
      audio.play();

      const clipDuration = getClipDuration(gameState.step);
      const timeout = setTimeout(() => {
        console.debug("Stopping playback after clip duration");
        audio.pause();
        setGameState((prev) => ({ ...prev, isPlaying: false }));
      }, clipDuration * 1000);

      return () => {
        clearTimeout(timeout);
        audio.pause(); // Ensure audio stops on unmount or state change
        console.debug("Cleanup: Audio paused and timeout cleared");
      };
    }
  }, [gameState.isPlaying, gameState.step]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.ceil(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Calculate the unlocked duration based on current step
  const getUnlockedDuration = (step) => {
    return step <= durations.length ? durations[step - 1] : maxUnlockedDuration; // Full song if step > 5
  };

  const getClipDuration = (step) => {
    return durations[step - 1] || 0;
  };

  const togglePlay = () => {
    const audio = audioRef.current;

    if (gameState.isPlaying) {
      //console.debug("Manually pausing playback");
      audio.pause();
      setGameState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      //console.debug("Manually starting playback");
      setGameState((prev) => ({ ...prev, isPlaying: true }));
    }
  };

  const getBlurValue = () => {
    if (gameState.isRevealed) return "0px";
    const blurValues = ["100px", "98px", "83px", "52px", "22px", "0px"];
    return blurValues[gameState.step - 1];
  };

  return (
    <div className="mb-8 max-w-sm mx-auto">
      <div className="flex items-start mb-6 gap-3">
        {/* Vertical Volume Control */}
        <div className="flex flex-col items-center justify-center h-full space-y-5 space-x-2.5 mr-2">
          {/* Dynamic Volume Icon */}
          <div className="w-5 h-5">
            {volume === 0 ? (
              <img
                src="/assets/svg/volume-off.svg"
                alt="Muted"
                className="w-full h-full"
              />
            ) : volume < 0.5 ? (
              <img
                src="/assets/svg/volume-low.svg"
                alt="Low volume"
                className="w-full h-full"
              />
            ) : (
              <img
                src="/assets/svg/volume-medium.svg"
                alt="High volume"
                className="w-full h-full"
              />
            )}
          </div>

          {/* Vertical Slider */}
          <div className="relative h-64 w-5 flex items-center">
            {" "}
            {/* Increased height */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              class="vertical"
              orient="vertical"
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute h-full w-2 appearance-none bg-transparent"
              style={{
                "-webkit-appearance": "slider-vertical",
                WebkitAppearance: "slider-vertical",
                writingMode: "bt-lr",
                background: `linear-gradient(to top, white ${
                  volume * 100
                }%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                borderRadius: "10px",
              }}
            />
          </div>
        </div>

        {/* Album Cover Container (unchanged) */}
        <div className="relative rounded-xl overflow-hidden flex-1">
          <div
            className="aspect-square bg-black flex items-center justify-center"
            style={{
              filter: `blur(${getBlurValue()})`,
              transition: "filter 0.3s ease",
            }}
          >
            {song && (
              <img
                src={song.coverUrl || "/covers/placeholder-cover.png"}
                alt="Album cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 backdrop-blur-sm"
              disabled={!song}
            >
              {gameState.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Step {gameState.step}/ {durations.length}
        </span>
        {gameState.step < durations.length && !gameState.isRevealed && (
          <button
            onClick={() => {
              console.debug("Advancing to next step");
              nextStep();
            }}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          >
            Next Step
          </button>
        )}
      </div>

      <div
        ref={barRef}
        className="relative w-full h-2.5 rounded-full bg-gray-700 overflow-visible"
      >
        {/* Gray bar for max unlocked duration */}
        <div
          className="absolute top-0 left-0 h-full bg-gray-500 bg-opacity-50"
          style={{ width: "100%" }}
        ></div>

        {/* Step markers */}
        {stepMarkers.map(({ time, key }) => {
          const position = (time / maxUnlockedDuration) * barWidth;
          return (
            <div
              key={key}
              className="absolute top-0 h-full"
              style={{ left: `${position}px` }}
            >
              <div className="w-0.5 h-full bg-black z-0"></div>
            </div>
          );
        })}

        {/* Blue played bar */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500"
          style={{
            width: `${
              (getUnlockedDuration(gameState.step) / maxUnlockedDuration) *
              Math.min(currentTime / getUnlockedDuration(gameState.step), 1) *
              barWidth
            }px`,
          }}
        ></div>
      </div>

      {/* Display time text */}
      <div className="flex justify-between text-sm text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(maxUnlockedDuration)}</span>
      </div>

      <audio ref={audioRef} src={song?.filePath} preload="auto" />
    </div>
  );
};

// Icon components for cleaner JSX
const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-gray-800"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
      clipRule="evenodd"
    />
  </svg>
);

const PauseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-gray-800"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

export default AudioPlayer;
