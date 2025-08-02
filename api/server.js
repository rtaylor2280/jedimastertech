// api/server.js
import express from "express";
import extractHandler from "./extract.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.post("/api/extract-audio", extractHandler);

app.listen(PORT, ()=> {
  console.log(`VPS Extraction API up on http://0.0.0.0:${PORT}`);
});
