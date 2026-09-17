const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;

app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'Roblox Audio Uploader' });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!ROBLOX_API_KEY) {
      return res.status(500).json({ error: 'API Key belum diset di server' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    form.append('assetType', 'Audio');
    form.append('displayName', req.body.name || 'MyAudio');
    form.append('description', req.body.description || 'Uploaded via tool');
    form.append('creationContext', JSON.stringify({
      creator: { userId: String(req.body.userId || '0') }
    }));

    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: {
        'x-api-key': ROBLOX_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Roblox error:', data);
      return res.status(response.status).json(data);
    }

    res.json({
      success: true,
      operationId: data.path || null,
      message: 'Upload dikirim ke Roblox. Cek Creator Dashboard dalam 1-5 menit.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
