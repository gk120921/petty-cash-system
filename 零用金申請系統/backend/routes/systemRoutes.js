const express = require('express');
const { translateText } = require('../services/translateService');
const { performOCR } = require('../services/ocrService');
const { getConfig, updateConfig } = require('../config/configManager');
const upload = require('../middleware/upload');

const router = express.Router();

// Config Management
router.get('/config', (req, res) => res.json(getConfig()));
router.post('/config', (req, res) => {
  const updated = updateConfig(req.body);
  res.json({ success: true, config: updated });
});

// Debug Status
router.get('/debug-status', (req, res) => res.send("Server is Up-to-Date (Modular Version) - " + new Date().toLocaleTimeString()));

// OCR Endpoint
router.post('/ocr', upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const data = await performOCR(req.file.path, req.file.mimetype);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Translation Endpoint
router.post('/translate', async (req, res) => {
  const { text } = req.body;
  try {
    const translated = await translateText(text);
    res.json({ text: translated });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
