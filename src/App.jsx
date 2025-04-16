import { useState, useEffect } from "react";
import { getRandomSong, loadAllSongs, getAllSongs } from "./utils/songs";
import AudioPlayer from "./components/AudioPlayer";
import ResultDisplay from "./components/ResultDisplay";
import GuessAutocompleteInput from "./components/GuessAutocompleteInput";

const MAX_GUESSES = 6;

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [gameState, setGameState] = useState({
    step: 1,
    isPlaying: false,
    guesses: [],
    isRevealed: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeGame = async () => {
      await loadAllSongs();
      const songs = getAllSongs();
      setAllSongs(songs);
      setCurrentSong(getRandomSong());
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

    setGameState((prev) => ({
      ...prev,
      guesses: newGuesses,
      isRevealed: isCorrect || maxGuessesReached,
    }));
  };

  const nextStep = () => {
    if (gameState.step < 6) {
      setGameState((prev) => ({
        ...prev,
        step: prev.step + 1,
        isPlaying: false,
      }));
    }
  };

  const resetGame = () => {
    setCurrentSong(getRandomSong());
    setGameState({
      step: 1,
      isPlaying: false,
      guesses: [],
      isRevealed: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="animate-pulse mb-6">
        </div>
        <p className="text-lg font-medium animate-pulse tracking-widest">
          Cargando canciones...
        </p>
      </div>
    );
  }

  return (
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
              nextStep={nextStep}
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
            />
          </div>
        </div>

        {!gameState.isRevealed && gameState.guesses.length < 6 && (
          <GuessAutocompleteInput
            onSubmit={handleGuessSubmit}
            disabled={gameState.isPlaying}
            songs={allSongs}
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
      </main>
    </div>
  );
}

export default App;
