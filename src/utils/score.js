import fs from "fs";
const leaderboardPath = "public/scores.json";

export function getLeaderboard() {
  try {
    const data = fs.readFileSync(leaderboardPath, "utf8");
    const scores = JSON.parse(data);
    // Sort by score descending
    return Object.entries(scores)
      .map(([username, score]) => ({ username, score }))
      .sort((a, b) => b.score - a.score);
  } catch (err) {
    return [];
  }
}

export function saveScore(username, newScore) {
  let scores = {};
  try {
    const data = fs.readFileSync(leaderboardPath, "utf8");
    scores = JSON.parse(data);

    if (!scores[username] || newScore > scores[username]) {
      scores[username] = newScore;
      fs.writeFileSync(leaderboardPath, JSON.stringify(scores, null, 2));
    }
  } catch (err) {
    console.error("Failed to save score:", err);
  }
}

export function calculateScore({ guessesUsed, timeTaken }) {
  const baseScore = 100;
  const guessPenalty = guessesUsed * 10;
  const timePenalty = Math.floor(timeTaken / 1000); // 1 point per second
  return Math.max(0, baseScore - guessPenalty - timePenalty);
}

export async function submitStreakScore(username, streak) {
  const hostname = window.location.hostname;
  const url = `http${hostname === "localhost" ? "" : "s"}://${hostname}${
    hostname === "localhost" ? ":5240" : ""
  }${hostname === "localhost" ? "" : "/api"}/leaderboard`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, score: streak }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
}
