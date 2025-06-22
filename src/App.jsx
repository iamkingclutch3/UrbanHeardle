import { useState, useEffect } from "react";
import { getRandomSong, getSongList } from "./utils/songs";
import AudioPlayer from "./components/AudioPlayer";
import ResultDisplay from "./components/ResultDisplay";
import GuessAutocompleteInput from "./components/GuessAutocompleteInput";
import ChooseArtist from "./components/ChooseArtist";
import FeedbackWidget from "./components/FeedbackWidget";
//import Leaderboard from "./components/Leaderboard";
import { submitStreakScore } from "./utils/score";

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState("");
  const [gameState, setGameState] = useState({
    step: 1,
    isPlaying: false,
    guesses: [],
    isRevealed: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "Guest";
  });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!username || streak === 0) return;
    submitStreakScore(username, streak).catch((error) => {
      console.error("Error submitting streak score:", error);
    });
  }, [streak, username]);

  useEffect(() => {
    const initializeGame = async () => {
      setCurrentSong(await getRandomSong(selectedArtist));
      setIsLoading(false);
    };

    initializeGame();
  }, []);

  const handleGuessSubmit = (guess) => {
    if (gameState.guesses.length >= 6 || gameState.isRevealed) return;

    const isCorrectArtist =
      guess.artist.toLowerCase() === currentSong.artist.toLowerCase();
    const isCorrectTitle =
      guess.title.toLowerCase() === currentSong.title.toLowerCase();

    const newGuesses = [
      ...gameState.guesses,
      {
        ...guess,
        isCorrectArtist,
        isCorrectTitle,
      },
    ];

    const maxGuessesReached = newGuesses.length >= 6;
    const isCorrect = isCorrectArtist && isCorrectTitle;

    if (!isCorrect && !maxGuessesReached) {
      nextStep();
    }

    if (isCorrect) {
      setStreak((prev) => prev + 1);
    }

    if (!isCorrect && maxGuessesReached) {
      setStreak(0);
    }

    setGameState((prev) => ({
      ...prev,
      guesses: newGuesses,
      isRevealed: isCorrect || maxGuessesReached,
    }));
  };

  useEffect(() => {
    if (!isLoading) {
      resetGame();
      setStreak(0);
    }
  }, [selectedArtist]);

  const nextStep = () => {
    if (gameState.step < 6) {
      setGameState((prev) => ({
        ...prev,
        step: prev.step + 1,
        //isPlaying: false,
      }));
    }
  };

  const resetGame = async () => {
    const newSong = await getRandomSong(selectedArtist);
    setCurrentSong(newSong);
    setGameState({
      step: 1,
      isPlaying: false,
      guesses: [],
      isRevealed: false,
    });
    
    if (
      !gameState.guesses.some(
      (g) => g.isCorrectArtist && g.isCorrectTitle
      )
    ) {
      console.log(gameState.guesses);
      setStreak(0);
    }
    
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="animate-pulse mb-6"></div>
        <p className="text-lg font-medium animate-pulse tracking-widest">
          Cargando canciones...
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating Leaderboard Bubble 
      <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 w-60 hover:w-64 transition-all duration-200">
          <Leaderboard username={username} setUsername={setUsername} />
        </div>
      </div>*/}
      {/* Floating ChooseArtist Bubble */}
      <div className="hidden md:block fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 w-60 hover:w-64 transition-all duration-200">
          <ChooseArtist
            fetchSuggestions={async (query) => {
              const songs = await getSongList();

              // Helper function to remove accents and diacritics
              const removeAccents = (str) => {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              };

              const normalizedQuery = removeAccents(query.toLowerCase());

              // Count appearances per artist
              const artistCount = {};
              for (const song of songs) {
                const normalizedArtist = removeAccents(
                  song.artist.toLowerCase()
                );
                if (normalizedArtist.includes(normalizedQuery)) {
                  artistCount[song.artist] =
                    (artistCount[song.artist] || 0) + 1;
                }
              }

              // Build unique artist list with appearances
              const uniqueArtists = Object.entries(artistCount).map(
                ([artist, count]) => ({
                  artist: `${artist} (${count})`,
                })
              );

              return uniqueArtists;
            }}
            onArtistSelect={setSelectedArtist}
          />
        </div>
      </div>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <header className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Povlao Guess</h1>
        </header>
        <main className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row mb-6">
            <div className="flex-1 md:mr-[-100px]">
              <AudioPlayer
                song={currentSong}
                gameState={gameState}
                setGameState={setGameState}
                handleGuessSubmit={handleGuessSubmit}
                setCurrentSong={setCurrentSong}
                getRandomSong={getRandomSong}
              />
            </div>
            <div className="hidden md:block w-px bg-gray-600 opacity-50 mx-10"></div>{" "}
            <div className="w-full md:w-1/3 md:pl-4">
              <ResultDisplay
                guesses={gameState.guesses}
                song={gameState.isRevealed ? currentSong : null}
                hasLost={
                  gameState.isRevealed &&
                  !gameState.guesses.some(
                    (g) =>
                      g.artist.toLowerCase() ===
                        currentSong.artist.toLowerCase() &&
                      g.title.toLowerCase() === currentSong.title.toLowerCase()
                  )
                }
                streak={streak}
              />
            </div>
          </div>

          {!gameState.isRevealed && gameState.guesses.length < 6 && (
            <GuessAutocompleteInput
              onSubmit={handleGuessSubmit}
              disabled={gameState.isPlaying}
              fetchSuggestions={async (query) => {
                const songs = await getSongList();

                // Helper function to remove accents and diacritics
                const removeAccents = (str) => {
                  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                };

                const normalizedQuery = removeAccents(query.toLowerCase());

                return songs.filter((song) => {
                  const normalizedTitle = removeAccents(
                    song.title.toLowerCase()
                  );
                  const normalizedArtist = removeAccents(
                    song.artist.toLowerCase()
                  );
                  return (
                    normalizedTitle.includes(normalizedQuery) ||
                    normalizedArtist.includes(normalizedQuery)
                  );
                });
              }}
            />
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={resetGame}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"
            >
              Nuevo juego
            </button>
          </div>
          <FeedbackWidget />
        </main>
      </div>
    </div>
  );
}

export default App;
