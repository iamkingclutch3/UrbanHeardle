const MAX_GUESSES = 6;

const ResultDisplay = ({ guesses, song, hasLost, streak }) => {
  const filledRows = [...guesses];
  const emptyRows = Array.from({ length: MAX_GUESSES - guesses.length });

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 h-full">
      {/* Streak Counter - Added at the top */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tus intentos</h2>
        {streak > 0 && (
          <div className="flex items-center bg-gray-700 rounded-full px-3 py-1">
            <span className="text-yellow-400 font-bold mr-1">🔥</span>
            <span className="text-sm font-medium">
              Racha: <span className="text-yellow-400">{streak}</span>
            </span>
          </div>
        )}
      </div>

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
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `¡He adivinado la canción "${song.artist} - ${
                    song.title
                  }" en ${filledRows.length} intento${
                    filledRows.length === 1 ? "" : "s"
                  } en Povlao guess! ¿Puedes hacerlo mejor?`
                )}&url=https://povlaoguess.sytes.net/`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gray-100 hover:bg-gray-200 transition text-sm font-medium mt-6"
              >
                <svg
                  viewBox="0 0 1200 1227"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  class="w-4 h-4 fill-black"
                >
                  <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"></path>
                </svg>
                <span class="text-black font-bold">Share</span>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
