const MAX_GUESSES = 6;

const ResultDisplay = ({ guesses, song, hasLost }) => {
  const filledRows = [...guesses];
  const emptyRows = Array.from({ length: MAX_GUESSES - guesses.length });

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 h-full">
      <h2 className="text-xl font-semibold mb-4">Tus intentos</h2>

      <div className="flex flex-col gap-2">
        {/* Filled guess bubbles */}
        {filledRows.map((guess, index) => (
          <div
            key={`guess-${index}`}
            className="flex justify-between items-center px-4 py-2 rounded-full bg-gray-700"
          >
            <span className="font-medium text-sm">
              <span
                className={
                  guess.isCorrectArtist ? "text-green-400" : "text-gray-400"
                }
              >
                {guess.artist}
              </span>{" "}
              -{" "}
              <span
                className={
                  guess.isCorrectTitle ? "text-green-400" : "text-gray-400"
                }
              >
                {guess.title}
              </span>
            </span>
          </div>
        ))}

        {/* Empty placeholder bubbles */}
        {emptyRows.map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex justify-between items-center px-4 py-2 rounded-full bg-gray-700 bg-opacity-40 text-gray-500 italic"
          >
            <span>—</span>
          </div>
        ))}
      </div>

      {/* Final answer highlight */}
      {song && (
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          {hasLost ? (
            <>
              <p className="text-red-400 font-medium">Buen intento 😢</p>
              <p className="text-gray-300">La respuesta correcta era:</p>
              <p>
                {song.artist} - {song.title}
              </p>
            </>
          ) : (
            <>
              <p className="text-green-400 font-medium">Bien hecho! 😎</p>
              <p className="text-gray-300">
                {song.artist} - {song.title}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
