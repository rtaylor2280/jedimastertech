// /api/server.js
import express from 'express';
import path from 'path';
import extractHandler from './extract.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve your front-end
//    When someone hits “/” or any file under “/public”, express will serve it.
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir));

// 2. JSON parsing (in case you ever switch to POST + JSON)
app.use(express.json());

// 3. Mount your extraction endpoint
//    Clients call: GET /api/extract-audio?url=…&format=mp3&start=0:30&end=1:15
app.get('/api/extract-audio', extractHandler);

// 4. Health check (optional)
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 5. Fallback: if someone tries a route that doesn't exist, send them index.html
//    (so you can do client-side routing in the future if you like)
app.use((_req, res) => {
  res.sendFile(path.join(publicDir, 'soundCapture.html'));
});

// Start it up
app.listen(PORT, () => {
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT}`);
});
