import { useState } from "react";

const GuessAutocompleteInput = ({ songs, onSubmit, disabled }) => {
  disabled = false;
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setFiltered([]);
      return;
    }

    const lower = value.toLowerCase();
    const matches = songs.filter(
      (s) =>
        s.artist.toLowerCase().includes(lower) ||
        s.title.toLowerCase().includes(lower)
    );
    setFiltered(matches.slice(0, 6));
  };

  const handleSelect = (song) => {
    const fullText = `${song.artist} - ${song.title}`;
    setQuery(fullText);
    setFiltered([]);
    onSubmit({ artist: song.artist, title: song.title });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Optional: let users enter guesses manually in "Artist - Title" format
    const parts = query.split(" - ");
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      onSubmit({ artist: parts[0].trim(), title: parts[1].trim() });
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-8">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Escribe para buscar..."
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.map((song) => (
            <li
              key={`${song.artist}-${song.title}`}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setQuery(`${song.artist} - ${song.title}`);
                setFiltered([]);
              }}
            >
              {song.artist} — {song.title}
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={disabled || !query.trim()}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        Adivinar
      </button>
    </form>
  );
};

export default GuessAutocompleteInput;
