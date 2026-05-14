const axios = require('axios');

/**
 * Service to handle translations using Google's free translation API
 */
const translateText = async (text) => {
  if (!text) return '';

  try {
    // Basic language detection: check if contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    const targetLang = hasChinese ? 'en' : 'zh-TW';
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURI(text)}`;
    
    console.log(`[TranslateService] Translating [${text}] to [${targetLang}]...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (response.data && response.data[0]) {
      const translatedText = response.data[0].map(x => x[0]).join('').trim();
      return translatedText;
    } else {
      console.warn('[TranslateService] Google Translate returned empty or unexpected data');
      return text;
    }
  } catch (error) {
    console.error('[TranslateService] Error:', error.message);
    throw new Error('Translation failed');
  }
};

module.exports = {
  translateText
};
