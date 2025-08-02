import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';

// Setup __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const TEMP_DIR = path.join(__dirname, 'temp');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Ensure temp/output folders exist
await fs.mkdir(TEMP_DIR, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

// Helper: validate and parse times
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) throw new Error('Invalid time format');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  throw new Error('Invalid time format');
}

function isValidYouTubeUrl(url) {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
}

// Main route
app.post('/api/extract-audio', async (req, res) => {
  const { videoUrl, format, startTime, endTime } = req.body;

  try {
    if (!videoUrl || !format) {
      return res.status(400).json({ error: 'Missing videoUrl or format' });
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    if (!['mp3', 'wav', 'saber-wav'].includes(format)) {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    const startSeconds = startTime ? parseTimeToSeconds(startTime) : null;
    const endSeconds = endTime ? parseTimeToSeconds(endTime) : null;

    if (startSeconds !== null && endSeconds !== null && startSeconds >= endSeconds) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    const jobId = uuidv4();
    const tempPath = path.join(TEMP_DIR, `${jobId}_temp.wav`);
    const outputExt = format === 'saber-wav' ? 'wav' : format;
    const outputPath = path.join(OUTPUT_DIR, `${jobId}.${outputExt}`);

    // yt-dlp audio download
    const ytdlpArgs = [
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'wav',
      '--audio-quality', '0',
      '-o', tempPath,
      videoUrl
    ];
    const ytdlp = spawn('yt-dlp', ytdlpArgs);

    await new Promise((resolve, reject) => {
      ytdlp.on('close', code => code === 0 ? resolve() : reject(new Error(`yt-dlp failed with code ${code}`)));
      ytdlp.on('error', reject);
    });

    // FFmpeg processing
    let ffmpegCmd = ffmpeg(tempPath);
    if (startSeconds !== null) ffmpegCmd = ffmpegCmd.seekInput(startSeconds);
    if (endSeconds !== null) ffmpegCmd = ffmpegCmd.duration(endSeconds - (startSeconds || 0));

    if (format === 'saber-wav') {
      ffmpegCmd = ffmpegCmd.audioChannels(1).audioFrequency(44100).audioCodec('pcm_s16le');
    } else if (format === 'mp3') {
      ffmpegCmd = ffmpegCmd.audioCodec('libmp3lame').audioBitrate('320k');
    } else if (format === 'wav') {
      ffmpegCmd = ffmpegCmd.audioCodec('pcm_s16le');
    }

    await new Promise((resolve, reject) => {
      ffmpegCmd.save(outputPath).on('end', resolve).on('error', reject);
    });

    await fs.unlink(tempPath).catch(() => {});

    res.download(outputPath, `audio.${outputExt}`, async err => {
      if (err) console.error('Download error:', err);
      await fs.unlink(outputPath).catch(() => {});
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Audio extraction failed: ' + err.message });
  }
});

// Optional health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
