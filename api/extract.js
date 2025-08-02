import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  const { url, format = 'mp3', start, end } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  const tempFile = `output_${Date.now()}.${format}`;
  const outputPath = path.join('/tmp', tempFile);

  const startOpt = start ? `-ss ${start}` : '';
  const endOpt = end ? `-to ${end}` : '';

  // Sanitize format to supported types only
  const safeFormat = ['mp3', 'wav'].includes(format) ? format : 'mp3';

  const command = `yt-dlp -f bestaudio -o - "${url}" | ffmpeg -hide_banner -loglevel error -i pipe:0 ${startOpt} ${endOpt} -f ${safeFormat} "${outputPath}"`;

  exec(command, (err) => {
    if (err || !fs.existsSync(outputPath)) {
      console.error('Extraction error:', err);
      return res.status(500).json({ error: 'Audio extraction failed' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${tempFile}"`);
    res.setHeader('Content-Type', safeFormat === 'wav' ? 'audio/wav' : 'audio/mpeg');

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
  });
}
