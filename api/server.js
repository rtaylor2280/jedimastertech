// api/server.js
import express from "express";
import cors from "cors";
import extractHandler from "./extract.js";

const app  = express();
const PORT = process.env.PORT || 3000;

// 1. Enable CORS so your Vercel‐hosted front end can call your VPS API:
app.use(cors());

// 2. Parse JSON bodies for POST /api/extract-audio
app.use(express.json());

// 3. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 4. Your extraction endpoint
app.post("/api/extract-audio", extractHandler);

// 5. Catch-all 404 for anything else (optional)
app.use((req, res) => res.status(404).send("Not found"));

// 6. Start listening
app.listen(PORT, () => {
  console.log(`VPS Extraction API up on http://0.0.0.0:${PORT}`);
});
