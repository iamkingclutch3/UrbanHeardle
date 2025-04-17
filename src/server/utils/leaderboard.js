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
