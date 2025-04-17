import express from "express";
import cors from "cors";
import genManifest from "./utils/generateManifest.js";
import compression from "compression";
import router from "./routes/index.js";

const app = express();
const PORT = 5240; // No 3000 or 7000

app.use(cors());
app.use(compression());
app.use(express.json());
app.use("/", router);

export function startServer() {
  genManifest();

  app.listen(PORT, () => {
    console.log(
      `Local API server running at http://localhost:${PORT}/api/songs`
    );
  });
}
