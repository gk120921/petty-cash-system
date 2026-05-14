const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Could not connect to database', err);
  else console.log('Connected to SQLite database');
});

/**
 * 助手函式：確保欄位存在（用於相容舊資料庫）
 */
function ensureColumnExists(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) return;
    const exists = columns.some(c => c.name === columnName);
    if (!exists) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  });
}

db.serialize(() => {
  // 1. 費用類別表
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_zh TEXT NOT NULL,
    name_en TEXT,
    account_code TEXT,
    type TEXT DEFAULT 'EXPENSE'
  )`);

  // 2. 供應商表
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    tax_id TEXT,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    default_category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (default_category_id) REFERENCES categories (id)
  )`);

  // 3. 人員表
  db.run(`CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Employee',
    password TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 4. 零用金收支表
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_date TEXT NOT NULL,
    reimbursement_date TEXT,
    supplier_id INTEGER,
    category_id INTEGER,
    detail_en TEXT,
    detail_zh TEXT,
    personnel_id INTEGER,
    incoming REAL DEFAULT 0,
    outgoing REAL DEFAULT 0,
    has_bill BOOLEAN DEFAULT 1,
    pay_status TEXT DEFAULT 'PAID',
    image_path TEXT,
    ai_raw_text TEXT,
    no_bill_reason_zh TEXT,
    no_bill_reason_en TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (personnel_id) REFERENCES personnel (id)
  )`);

  // 5. 系統設定表
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // --- 舊資料庫相容性遷移 (Migrations) ---
  ensureColumnExists('categories', 'account_code', 'TEXT');
  ensureColumnExists('categories', 'type', "TEXT DEFAULT 'EXPENSE'");
  ensureColumnExists('personnel', 'employee_id', 'TEXT UNIQUE');
  ensureColumnExists('personnel', 'role', "TEXT DEFAULT 'Employee'");
  ensureColumnExists('personnel', 'password', 'TEXT');
  ensureColumnExists('personnel', 'status', "TEXT DEFAULT 'ACTIVE'");
  ensureColumnExists('expenses', 'is_archived', 'INTEGER DEFAULT 0');

  // --- 初始預設資料 ---
  const defaultCategories = [
    ['工廠使用費用 (Factory Expenses)', 'Factory Expenses'],
    ['宿舍使用費用 (Dormitory Expenses)', 'Dormitory Expenses'],
    ['交通費用 (Transportation Expenses)', 'Transportation Expenses'],
    ['消耗品費用 (Consumables)', 'Consumables']
  ];
  db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO categories (name_zh, name_en) VALUES (?, ?)");
      defaultCategories.forEach(cat => stmt.run(cat));
      stmt.finalize();
    }
  });

  const defaultPersonnel = ['義昌(yichang)', 'Godson Livish 人資-賈申', 'Joseph leon parvish', 'Kabir 謝比爾', 'shanka'];
  db.get("SELECT COUNT(*) as count FROM personnel", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO personnel (name) VALUES (?)");
      defaultPersonnel.forEach(name => stmt.run(name));
      stmt.finalize();
    }
  });
});

module.exports = db;
