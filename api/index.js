const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-roblox-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'OK',
      service: 'Roblox Audio Uploader',
      version: '2.0'
    });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-roblox-api-key'];
    const userId = req.body.userId;
    const name = req.body.name || 'MyAudio';
    const fileData = req.body.file;
    const fileName = req.body.fileName || 'audio.mp3';
    const fileType = req.body.fileType || 'audio/mpeg';

    if (!apiKey || apiKey.length < 20) {
      return res.status(400).json({ error: 'API Key tidak valid' });
    }

    if (!userId || !/^\d+$/.test(String(userId))) {
      return res.status(400).json({ error: 'User ID tidak valid' });
    }

    if (!fileData) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const base64Clean = fileData.replace(/^data:[^,]+,/, '');
    const fileBuffer = Buffer.from(base64Clean, 'base64');

    if (fileBuffer.length > 4.5 * 1024 * 1024) {
      return res.status(413).json({
        error: 'File terlalu besar untuk Vercel (maks 4.5MB). Kompres dulu.'
      });
    }

    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: fileType
    });
    form.append('assetType', 'Audio');
    form.append('displayName', String(name).substring(0, 50));
    form.append('description', 'Uploaded via MUSIC Anti-Copyright Pro');
    form.append('creationContext', JSON.stringify({
      creator: { userId: String(userId) }
    }));

    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();
    console.log(`[Upload] User ${userId} | Status ${response.status} | Size ${fileBuffer.length}`);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || 'Upload gagal',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      operationId: data.path || null,
      message: 'Upload dikirim ke Roblox'
    });

  } catch (err) {
    console.error('[Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
