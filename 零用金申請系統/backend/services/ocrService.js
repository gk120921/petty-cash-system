const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const { getConfig } = require('../config/configManager');

// --- Google Document AI Constants ---
const GOOGLE_PROJECT_ID = '766592247498';
const GOOGLE_LOCATION = 'us'; 
const GOOGLE_PROCESSOR_ID = '900d50d7818d58b1';

// 關鍵修正：將環境變數指向本機金鑰檔案 (Critical Fix: Point env var to local credentials)
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '..', 'google-creds.json');

let docAiClient = null;
try {
  docAiClient = new DocumentProcessorServiceClient();
  console.log('[OCRService] Google Document AI Client initialized with local JSON.');
} catch (err) {
  console.error('[OCRService] Failed to init Google Document AI Client:', err.message);
}

/**
 * Professional OCR using Google Document AI
 */
async function processWithDocumentAI(imagePath) {
  if (!docAiClient) throw new Error('Document AI Client not initialized');

  const name = `projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/processors/${GOOGLE_PROCESSOR_ID}`;
  const imageFile = fs.readFileSync(imagePath);
  const encodedImage = Buffer.from(imageFile).toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : (ext === '.png' ? 'image/png' : 'image/jpeg');

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: mimeType,
    },
  };

  const [result] = await docAiClient.processDocument(request);
  const { document } = result;
  
  const getEntity = (type) => document.entities.find(e => e.type === type)?.mentionText;
  
  // 嘗試從原始文字中找出可能的品名 (Heuristic: first non-empty line after header)
  let description = getEntity('line_item/description');
  const supplier = getEntity('supplier_name');
  if (!description && document.text) {
      const lines = document.text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      // 避開常見的標題關鍵字，且避開與供應商相同的文字
      description = lines.find(l => 
          !l.toLowerCase().includes('date') && 
          !l.toLowerCase().includes('total') && 
          !l.toLowerCase().includes('tax') &&
          !l.toLowerCase().includes('cashier') &&
          !l.toLowerCase().includes('tel') &&
          l !== supplier
      ) || '';
  }

  return {
    date: getEntity('invoice_date'),
    supplier: getEntity('supplier_name'),
    amount: parseFloat(getEntity('total_amount')?.replace(/[^0-9.]/g, '')),
    description: description,
    text: document.text
  };
}

/**
 * Fallback OCR using Google Gemini
 */
async function processWithGemini(imagePath, mimetype) {
  const config = getConfig();
  if (!config.GEMINI_API_KEY) throw new Error('Gemini API Key missing');

  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imageData = fs.readFileSync(imagePath).toString('base64');
  const prompt = `You are a professional accounting assistant. Analyze this receipt/invoice image and extract data into a valid JSON object. 
  Rules:
  1. date: Format as YYYY-MM-DD.
  2. supplier: Clean name of the store/company.
  3. amount: Total amount as a number (no currency symbols).
  4. description: A clear 5-8 word English summary of what was bought.
  5. text: Full raw text found in the image.
  
  Output ONLY the JSON object:
  { "date": "YYYY-MM-DD", "supplier": "Name", "amount": 123.45, "description": "...", "text": "..." }`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageData, mimeType: mimetype } }
  ]);

  const response = await result.response;
  const jsonText = response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(jsonText);
}

/**
 * Local Fallback OCR using Tesseract
 */
async function processWithTesseract(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng+chi_tra');

  // Basic extraction logic
  const amountMatch = text.match(/[\d,]+\.\d{2}/) || text.match(/Total\s*[:$]?\s*([\d,]+)/i);
  const dateMatch = text.match(/\d{4}[\/-]\d{2}[\/-]\d{2}/);

  return {
    text: text,
    amount: amountMatch ? parseFloat(amountMatch[1] ? amountMatch[1].replace(/,/g, '') : amountMatch[0].replace(/,/g, '')) : null,
    date: dateMatch ? dateMatch[0].replace(/\//g, '-') : null,
    supplier: text.split('\n')[0].trim(),
    description: '' // 改為自行輸入 (Changed to manual input only)
  };
}

/**
 * Main OCR Orchestrator
 */
async function performOCR(imagePath, mimetype) {
  const config = getConfig();

  // 1. 優先嘗試 Google Gemini (目前最強大的免費/低成本方案)
  if (config.GEMINI_API_KEY) {
    try {
      console.log('[OCRService] Using Gemini 1.5 Flash for OCR...');
      const data = await processWithGemini(imagePath, mimetype);
      return { ...data, description: '' };
    } catch (err) {
      console.warn('[OCRService] Gemini failed, trying Document AI...', err.message);
    }
  }

  // 2. 次要嘗試 Google Document AI (專業文件辨識)
  if (docAiClient) {
    try {
      console.log('[OCRService] Using Google Document AI...');
      const data = await processWithDocumentAI(imagePath);
      return { ...data, description: '' };
    } catch (err) {
      console.warn('[OCRService] Document AI failed, trying Tesseract...', err.message);
    }
  }

  // 3. 最後保底：在地端 Tesseract (完全免費且無須金鑰，但準確率較低)
  console.log('[OCRService] Using Tesseract (Local Fallback)...');
  const data = await processWithTesseract(imagePath);
  return { ...data, description: '' };
}

module.exports = {
  performOCR
};
