import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { startServer } from "./src/server/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174;

// Serve static frontend from dist/
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Handle SPA fallback (for React/Vue Router etc.)
app.get("/", (req, res, next) => {
  if (req.path.startsWith("/api")) return next(); // skip API
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Main server running at http://localhost:${PORT}`);
  startServer(); // Start the API server
});
