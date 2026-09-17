module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-roblox-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'OK',
      service: 'Roblox Audio Uploader',
      version: '3.0'
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
    const { userId, name, file: fileData, fileName, fileType } = req.body;

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
        error: 'File terlalu besar untuk Vercel (maks 4.5MB)'
      });
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([fileBuffer], { type: fileType || 'audio/mpeg' }),
      fileName || 'audio.mp3'
    );
    form.append('assetType', 'Audio');
    form.append('displayName', String(name || 'MyAudio').substring(0, 50));
    form.append('description', 'Uploaded via MUSIC Anti-Copyright Pro');
    form.append('creationContext', JSON.stringify({
      creator: { userId: String(userId) }
    }));

    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form
    });

    const data = await response.json();
    console.log(`[Upload] User ${userId} | Status ${response.status}`);

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
