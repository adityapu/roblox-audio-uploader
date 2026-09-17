const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Roblox Audio Uploader (Universal)',
    version: '2.0'
  });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const apiKey = req.headers['x-roblox-api-key'];
    const userId = req.body.userId;
    const displayName = req.body.name || 'MyAudio';

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      return res.status(400).json({ 
        error: 'API Key Roblox tidak valid atau kosong' 
      });
    }

    if (!userId || !/^\d+$/.test(String(userId))) {
      return res.status(400).json({ 
        error: 'User ID Roblox harus berupa angka' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File audio tidak ditemukan' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    form.append('assetType', 'Audio');
    form.append('displayName', displayName.substring(0, 50));
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

    console.log(`[Upload] User ${userId} | Status ${response.status}`);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || 'Upload ke Roblox gagal',
        details: data
      });
    }

    res.json({
      success: true,
      operationId: data.path || null,
      message: 'Upload dikirim ke Roblox. Asset ID muncul dalam 1-5 menit.'
    });

  } catch (err) {
    console.error('[Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server jalan di port ${PORT}`));
