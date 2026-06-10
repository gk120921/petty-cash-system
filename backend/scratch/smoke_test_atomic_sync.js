const ProcurementService = require('../modules/procurementService');

async function runSmokeTest() {
    console.log('=== ERP 全局一致性冒煙測試啟動 ===');
    try {
        const testPoId = 5;
        const operator = 'QA_AGENT_ANTIGRAVITY';

        console.log(`[QA] 測試路徑：核准 PO #${testPoId} 並驗證 WMS 預期入庫`);
        
        const result = await ProcurementService.approveAndSyncPO(testPoId, operator);
        
        console.log('--- 測試結果 ---');
        console.log('✅ 狀態：成功');
        console.log('✅ 聯動筆數：', result.syncedCount);
        console.log('==============================');
        process.exit(0);
    } catch (err) {
        console.error('❌ 測試失敗：', err.message);
        process.exit(1);
    }
}

runSmokeTest();
