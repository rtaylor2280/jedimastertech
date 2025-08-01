const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ytDlp = require('yt-dlp-exec');

const app = express();
app.use(express.json());

const TMP_DIR = path.join(os.tmpdir(), 'yt-audio');
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Helper to run yt-dlp and return path to downloaded file
async function downloadAudio(url) {
    const outFile = path.join(TMP_DIR, `${uuidv4()}.%(ext)s`);
    await ytDlp(url, {
        output: outFile,
        extractAudio: true,
        audioFormat: 'best',
        audioQuality: 0
    });
    // yt-dlp adds extension, find file
    const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(path.basename(outFile, '.%(ext)s')));
    if (files.length === 0) throw new Error('Download failed');
    return path.join(TMP_DIR, files[0]);
}

function formatOptions(format, saberCompatible) {
    if (format === 'mp3') {
        return ['-codec:a', 'libmp3lame', '-b:a', '320k'];
    }
    // WAV
    const opts = [];
    if (saberCompatible) {
        opts.push('-ac', '1', '-ar', '44100', '-sample_fmt', 's16');
    }
    return opts;
}

app.post('/api/extract', async (req, res) => {
    const { url, format = 'wav', saberCompatible = true, startTime, endTime } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Missing url' });
    }
    try {
        const inputFile = await downloadAudio(url);
        const outputFile = path.join(TMP_DIR, `${uuidv4()}.${format}`);
        let command = ffmpeg(inputFile);
        if (startTime) command = command.setStartTime(startTime);
        if (endTime) command = command.setDuration(parseTime(endTime) - (parseTime(startTime) || 0));
        command
            .outputOptions(formatOptions(format, saberCompatible))
            .toFormat(format)
            .on('end', () => {
                res.download(outputFile, err => {
                    fs.unlink(inputFile, () => {});
                    fs.unlink(outputFile, () => {});
                    if (err) console.error(err);
                });
            })
            .on('error', err => {
                console.error(err);
                res.status(500).json({ error: 'Processing failed' });
            })
            .save(outputFile);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Download failed' });
    }
});

function parseTime(str) {
    if (!str) return null;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
