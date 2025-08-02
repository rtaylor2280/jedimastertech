export default async function handler(req, res) {
  const videoId = req.query.videoId;
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY || !videoId) {
    return res.status(400).json({ error: 'Missing videoId or API key' });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,contentDetails,statistics`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'YouTube API fetch failed' });
  }
}
