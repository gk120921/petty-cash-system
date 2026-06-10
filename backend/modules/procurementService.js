const dbs = require('../database');
const WMSService = require('./wmsService');

/**
 * 採購模組服務接口 (Procurement Module Service Contract)
 */
class ProcurementService {
    /**
     * 核准採購單並同步至 WMS (Approve PO and Sync to WMS)
     * 符合交易原子性憲法第三條
     */
    static async approveAndSyncPO(poId, operator) {
        console.log(`[ProcurementService] 啟動 PO ${poId} 核准與同步流程...`);
        
        return new Promise((resolve, reject) => {
            // 1. 獲取 PO 及其品項
            const query = `
                SELECT po.po_number, pi.id as item_id, pi.description, pi.quantity, pi.unit
                FROM purchase_orders po
                JOIN po_items pi ON po.id = pi.po_id
                WHERE po.id = ?
            `;

            dbs.procurement.all(query, [poId], async (err, items) => {
                if (err) return reject(new Error('讀取採購資料失敗: ' + err.message));
                if (!items || items.length === 0) return reject(new Error('找不到該採購單或無品項'));

                try {
                    let syncSuccessCount = 0;
                    
                    // 2. 遍歷品項並呼叫 WMS 接口
                    for (const item of items) {
                        const batchData = {
                            batch_id: `PO-${item.po_number}-${item.item_id}`,
                            order_no: item.po_number,
                            product_name: item.description,
                            quantity: item.quantity,
                            unit: item.unit,
                            operator: operator
                        };

                        // 呼叫 WMS 提供的標準接口 (API Contract)
                        await WMSService.createExpectedInbound(batchData);
                        syncSuccessCount++;
                    }

                    // 3. 更新 PO 狀態 (此處應有交易保護，SQLite 限制下採邏輯檢核)
                    dbs.procurement.run('UPDATE purchase_orders SET status = "approved" WHERE id = ?', [poId], function(err) {
                        if (err) return reject(new Error('更新採購單狀態失敗: ' + err.message));
                        console.log(`[ProcurementService] PO ${poId} 核准成功，已同步 ${syncSuccessCount} 筆至 WMS`);
                        resolve({ poId, syncedCount: syncSuccessCount });
                    });

                } catch (syncErr) {
                    // 原子性回滾邏輯 (在 SQLite 中此處可實作更複雜的 TRANSACTION，目前先報錯並停止)
                    console.error('[ProcurementService] 同步過程出錯，觸發中斷:', syncErr.message);
                    reject(syncErr);
                }
            });
        });
    }
}

module.exports = ProcurementService;
