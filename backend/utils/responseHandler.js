/**
 * 統一 API 回應處理器
 * 確保全系統的回傳格式一致，便於前端處理與日誌監控
 */
const responseHandler = {
    success: (res, data = null, message = 'Success', code = 200) => {
      return res.status(code).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    },
  
    error: (res, message = 'Internal Server Error', error = null, code = 500) => {
      // 在開發環境中打印詳細錯誤，生產環境中僅記錄
      console.error(`[API Error] ${message}:`, error);
      
      return res.status(code).json({
        success: false,
        message,
        error: error ? error.message : null,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  module.exports = responseHandler;
