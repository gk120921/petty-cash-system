const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 設定路徑
const jsonPath = path.join('c:', 'Users', 'kst671nb', 'Desktop', 'AI優化實驗室流程', '印度倉庫系統', 'data.json');
const dbPath = path.join(__dirname, '..', 'nexus_master.db');

if (!fs.existsSync(jsonPath)) {
    console.error('找不到 data.json 檔案:', jsonPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// 團隊 Logic 工程師建議：加入自癒式建表邏輯
const setupTables = (callback) => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS wms_inventory (
            batch_id TEXT PRIMARY KEY, case_no TEXT, category TEXT, order_no TEXT, 
            warehouse_code TEXT, shelf_location TEXT, product_name TEXT, 
            batch_no TEXT, receive_date TEXT, quantity REAL, unit TEXT, 
            status TEXT, operator TEXT, created_at TEXT, updated_at TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS wms_products (
            product_id TEXT PRIMARY KEY, product_name TEXT UNIQUE, spec TEXT, 
            default_location TEXT, parent_product_name TEXT, conversion_rate REAL, 
            base_unit TEXT, alt_unit TEXT, created_at TEXT, updated_at TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS wms_locations (
            location_id TEXT PRIMARY KEY, warehouse_code TEXT, warehouse_category TEXT, 
            shelf_location TEXT, description TEXT, is_active INTEGER DEFAULT 1, 
            created_at TEXT, updated_at TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS wms_qc_status (
            code TEXT PRIMARY KEY, name TEXT, color TEXT, can_outbound INTEGER, 
            can_produce INTEGER, description TEXT, is_active INTEGER DEFAULT 1
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS wms_audit_log (
            log_id TEXT PRIMARY KEY, batch_id TEXT, product_name TEXT, 
            transaction_type TEXT, order_no TEXT, qty_before REAL, 
            qty_changed REAL, qty_after REAL, operator TEXT, remark TEXT, timestamp TEXT
        )`, callback);
    });
};

const migrate = () => {
    console.log('--- [團隊執行] 啟動 WMS 數據遷移 (Attempt 2) ---');
    
    setupTables(() => {
        try {
            const rawData = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(rawData);

            db.serialize(() => {
                // 1. 庫存
                const inventory = JSON.parse(data.wms_inventory || '[]');
                const stmtInv = db.prepare(`INSERT OR REPLACE INTO wms_inventory VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                inventory.forEach(item => stmtInv.run(item.batchId, item.caseNo, item.category, item.orderNo, item.warehouseCode, item.shelfLocation, item.productName, item.batchNo, item.receiveDate, item.quantity, item.unit, item.status, item.operator, item.createdAt, item.updatedAt));
                stmtInv.finalize();

                // 2. 產品
                const products = JSON.parse(data.wms_products || '[]');
                const stmtProd = db.prepare(`INSERT OR REPLACE INTO wms_products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                products.forEach(item => stmtProd.run(item.productId, item.productName, item.spec, item.defaultLocation, item.parentProductName, item.conversionRate, item.baseUnit, item.altUnit, item.createdAt, item.updatedAt));
                stmtProd.finalize();

                // 3. 儲位
                const locations = JSON.parse(data.wms_locations || '[]');
                const stmtLoc = db.prepare(`INSERT OR REPLACE INTO wms_locations VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                locations.forEach(item => stmtLoc.run(item.locationId, item.warehouseCode, item.warehouseCategory, item.shelfLocation, item.description, item.isActive ? 1 : 0, item.createdAt, item.updatedAt));
                stmtLoc.finalize();

                // 4. QC
                const qcStatus = JSON.parse(data.wms_qc_status || '[]');
                const stmtQC = db.prepare(`INSERT OR REPLACE INTO wms_qc_status VALUES (?, ?, ?, ?, ?, ?, ?)`);
                qcStatus.forEach(item => stmtQC.run(item.code, item.name, item.color, item.canOutbound ? 1 : 0, item.canProduce ? 1 : 0, item.description, item.isActive ? 1 : 0));
                stmtQC.finalize();

                // 5. 日誌
                const auditLogs = JSON.parse(data.wms_audit_log || '[]');
                const stmtAudit = db.prepare(`INSERT OR REPLACE INTO wms_audit_log VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                auditLogs.forEach(item => stmtAudit.run(item.logId, item.batchId, item.productName, item.transactionType, item.orderNo, item.qtyBefore, item.qtyChanged, item.qtyAfter, item.operator, item.remark, item.timestamp));
                stmtAudit.finalize();

                console.log(`✅ 遷移報告: 庫存(${inventory.length}), 產品(${products.length}), 儲位(${locations.length}), QC(${qcStatus.length}), 日誌(${auditLogs.length})`);
                console.log('--- 數據遷移成功完成 ---');
                db.close();
            });
        } catch (err) {
            console.error('❌ 遷移失敗:', err.message);
            db.close();
        }
    });
};

migrate();
