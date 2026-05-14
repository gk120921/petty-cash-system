const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const fs = require('fs');

// 初始化所有資料庫連線
const dbs = {};

const initDB = (name, path) => {
  dbs[name] = new sqlite3.Database(path, (err) => {
    if (err) {
      console.error(`無法連接到資料庫 ${name}:`, err.message);
    } else {
      console.log(`成功連接到資料庫: ${name}`);
    }
  });
};

// 連接所有資料庫
initDB('nexus', config.databases.nexus);
initDB('petty_cash', config.databases.petty_cash);
initDB('procurement', config.databases.procurement);

// 建立帳號中心 Table (如果不存在)
// 建立帳號中心與 WMS 相關 Table (如果不存在)
const setupNexusDB = () => {
  dbs.nexus.serialize(() => {
    // 1. 使用者主表
    dbs.nexus.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,    -- 對應零用金的 employee_id
        password TEXT NOT NULL,           -- 統一採用 bcrypt 加密
        real_name TEXT,                   -- 真實姓名
        dept_code TEXT,                   -- 部門代碼 (來自採購系統)
        dept_name TEXT,                   -- 部門名稱
        role TEXT DEFAULT 'user',         -- 系統角色 (admin, manager, user)
        module_permissions TEXT,          -- 模組權限 JSON
        status TEXT DEFAULT 'ACTIVE',     -- 帳號狀態
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. WMS 庫存表
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS wms_inventory (
      batch_id TEXT PRIMARY KEY,
      case_no TEXT,
      category TEXT,
      order_no TEXT,
      warehouse_code TEXT,
      shelf_location TEXT,
      product_name TEXT,
      batch_no TEXT,
      receive_date TEXT,
      quantity REAL,
      unit TEXT,
      status TEXT,
      operator TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    // 3. WMS 產品定義表
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS wms_products (
      product_id TEXT PRIMARY KEY,
      product_name TEXT UNIQUE,
      spec TEXT,
      default_location TEXT,
      parent_product_name TEXT,
      conversion_rate REAL,
      base_unit TEXT,
      alt_unit TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    // 4. WMS 儲位定義表
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS wms_locations (
      location_id TEXT PRIMARY KEY,
      warehouse_code TEXT,
      warehouse_category TEXT,
      shelf_location TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    )`);

    // 5. WMS QC 狀態表
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS wms_qc_status (
      code TEXT PRIMARY KEY,
      name TEXT,
      color TEXT,
      can_outbound INTEGER,
      can_produce INTEGER,
      description TEXT,
      is_active INTEGER DEFAULT 1
    )`);

    // 6. WMS 異動日誌表
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS wms_audit_log (
      log_id TEXT PRIMARY KEY,
      batch_id TEXT,
      product_name TEXT,
      transaction_type TEXT,
      order_no TEXT,
      qty_before REAL,
      qty_changed REAL,
      qty_after REAL,
      operator TEXT,
      remark TEXT,
      timestamp TEXT
    )`);

    // 7. 全域組織架構表 (Unified Organizational Hierarchy)
    dbs.nexus.run(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dept_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("Nexus Master 資料庫表格已完整初始化。");
  });
};

setupNexusDB();

module.exports = dbs;
