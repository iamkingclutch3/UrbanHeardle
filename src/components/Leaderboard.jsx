import { useEffect, useState } from "react";

export default function Leaderboard({ username }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const hostname = window.location.hostname;
    const url = `http${hostname === "localhost" ? "" : "s"}://${hostname}${
      hostname === "localhost" ? ":5240" : ""
    }${hostname === "localhost" ? "" : "/api"}/leaderboard`;

    fetch(url)
      .then((res) => res.json())
      .then(setScores)
      .catch((err) => {
        console.error("Error fetching leaderboard:", err);
      });
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow w-full">
      <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>
      <ul className="space-y-2 max-h-[500px] overflow-y-auto h-100">
        {scores.map((entry, i) => (
          <li
            key={entry.username}
            className="flex justify-between border-b border-gray-700 py-1 text-sm"
          >
            <span>
              {i + 1}. {entry.username}
            </span>
            <span className="text-gray-300">{entry.score} 🎵</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
