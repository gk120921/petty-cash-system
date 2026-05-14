const { translateText } = require('../backend/services/translateService');
const { performOCR } = require('../backend/services/ocrService');
const ExcelService = require('../backend/services/excelService');
const db = require('../backend/database');

async function runTests() {
  console.log('--- Starting Service Tests ---');

  // 1. Test Translate Service
  try {
    console.log('Testing Translation...');
    const result = await translateText('Hello world');
    console.log('Translate Result (Hello world -> ZH):', result);
    
    const result2 = await translateText('你好世界');
    console.log('Translate Result (你好世界 -> EN):', result2);
  } catch (err) {
    console.error('Translation Test Failed:', err.message);
  }

  // 2. Test Excel Service (Basic Check)
  try {
    console.log('\nTesting Excel Service...');
    const excelService = new ExcelService(db);
    if (excelService.db) {
      console.log('Excel Service initialized with DB successfully.');
    } else {
      console.error('Excel Service failed to initialize DB.');
    }
  } catch (err) {
    console.error('Excel Service Test Failed:', err.message);
  }

  // 3. Test OCR Service (Structure Check)
  try {
    console.log('\nTesting OCR Service...');
    if (typeof performOCR === 'function') {
      console.log('OCR Service performOCR function is available.');
    } else {
      console.error('OCR Service performOCR function is missing.');
    }
  } catch (err) {
    console.error('OCR Service Test Failed:', err.message);
  }

  console.log('\n--- Tests Completed ---');
  db.close();
}

runTests();
