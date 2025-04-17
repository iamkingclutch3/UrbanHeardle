const leaderboardPath = "public/scores.json";

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
