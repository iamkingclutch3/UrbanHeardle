import { useState, useEffect, useRef } from "react";

const ChooseArtist = ({ fetchSuggestions, onArtistSelect }) => {
  const [selectedArtist, setSelectedArtist] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  // Handler for selecting an artist
  const handleArtistSelect = (artist) => {
    setSelectedArtist(artist);
    setQuery(artist);
    setSuggestions([]);
    setShowDropdown(false);
    if (onArtistSelect) onArtistSelect(artist);
  };

  // Handler for clearing selection
  const handleClear = () => {
    setSelectedArtist("");
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    if (onArtistSelect) onArtistSelect("");
  };

  // Debounced fetch suggestions
  useEffect(() => {
    if (!query.trim() || selectedArtist) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results.map((s) => s.artist));
        setShowDropdown(true);
      } catch (e) {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, fetchSuggestions, selectedArtist]);

  return (
    <div
      className="hidden md:block fixed right-6 top-1/2 transform -translate-y-1/2 z-20"
      style={{ minWidth: 200, pointerEvents: "auto" }}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 w-56 p-3 flex flex-col items-center overflow-visible"
        style={{
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.25)",
          pointerEvents: "auto",
        }}
      >
        <h2 className="text-lg font-semibold mb-2 text-white">Artista</h2>
        <p className="text-sm text-gray-400 mb-4 text-center">
          Selecciona un artista para adivinar solo sus canciones
        </p>
        {!selectedArtist && (
          <div className="w-full relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe el nombre del artista..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              autoComplete="off"
              onFocus={() => query && setShowDropdown(true)}
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
            {showDropdown && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
                {suggestions.map((artist) => (
                  <li
                    key={artist}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleArtistSelect(artist)}
                  >
                    {artist}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {selectedArtist && (
          <div className="flex flex-col items-center w-full">
            <div className="text-white mb-3">
              Artista seleccionado: <b>{selectedArtist}</b>
            </div>
            <button
              onClick={handleClear}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Limpiar selección
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseArtist;
