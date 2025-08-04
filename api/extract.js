// api/extract.js - Vercel API route that forwards to VPS
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const VPS_API_URL = process.env.VPS_API_URL; // e.g., "http://71.237.6.110:8443/api"
  const JMT_API_KEY = process.env.JMT_API_KEY;

  if (!VPS_API_URL || !JMT_API_KEY) {
    return res.status(500).json({ error: 'Missing VPS configuration' });
  }

  try {
    // Forward the request to your VPS with API key authentication
    const vpsResponse = await fetch(`${VPS_API_URL}/extract-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': JMT_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      throw new Error(`VPS API error: ${vpsResponse.status} - ${errorText}`);
    }

    // Check if response is JSON (error) or binary (audio file)
    const contentType = vpsResponse.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      // It's an error response
      const errorData = await vpsResponse.json();
      return res.status(vpsResponse.status).json(errorData);
    }

    // It's a binary audio file - stream it through
    const contentLength = vpsResponse.headers.get('content-length');
    const contentDisposition = vpsResponse.headers.get('content-disposition');
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // Stream the response
    const reader = vpsResponse.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming failed' });
      }
    }

  } catch (error) {
    console.error('Extract API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process extraction request',
      details: error.message 
    });
  }
}