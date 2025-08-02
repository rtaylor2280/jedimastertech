# Jedi Master Tech - Saber Tools

A collection of web-based tools for custom lightsaber building and tuning. All tools are responsive and styled for both mobile and desktop use.

## Tools Included
- Proffie Color Converter
- Lightsaber Balance Calculator
- Sound Capture

## Usage
Install dependencies with `npm install` and start the backend with `npm start`. The server listens on port **3000** and exposes two endpoints:

- `GET /api/info?url=YOUTUBE_URL` returns title, thumbnail, and duration using **yt‑dlp**.
- `POST /api/extract` accepts JSON with `url`, `format`, `startTime`, and `endTime` and returns the processed audio file.

Both `ffmpeg` and `yt-dlp` binaries must be available on your system (e.g., `sudo apt install ffmpeg yt-dlp`). With the server running, open `index.html` in your browser to use the tools.

## Credits
Created by JediMasterTech
