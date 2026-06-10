const dbs = require('../database');

/**
 * WMS 模組服務接口 (WMS Module Service Contract)
 */
class WMSService {
    /**
     * 建立預期入庫紀錄 (Create Expected Inbound Record)
     * 符合原子性要求：由採購模組觸發
     */
    static async createExpectedInbound(data) {
        const { batch_id, order_no, product_name, quantity, unit, operator } = data;
        
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO wms_inventory 
                (batch_id, order_no, product_name, quantity, unit, status, warehouse_code, shelf_location, operator, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const now = new Date().toISOString();
            dbs.nexus.run(query, [
                batch_id, order_no, product_name, quantity, unit, 'EXPECTED', 
                'INBOUND_ZONE', 'DOCK', operator || 'SYSTEM_SYNC', now, now
            ], function(err) {
                if (err) {
                    console.error('[WMSService] 建立預期入庫失敗:', err.message);
                    return reject(err);
                }
                console.log(`[WMSService] 成功建立預期入庫: ${batch_id} (影響行數: ${this.changes})`);
                resolve(this.changes);
            });
        });
    }

    /**
     * 檢查庫存 (Check Stock Interface)
     */
    static async checkStock(product_name) {
        return new Promise((resolve, reject) => {
            dbs.nexus.get('SELECT SUM(quantity) as total FROM wms_inventory WHERE product_name = ? AND status = "AVAILABLE"', [product_name], (err, row) => {
                if (err) return reject(err);
                resolve(row ? (row.total || 0) : 0);
            });
        });
    }
}

module.exports = WMSService;
