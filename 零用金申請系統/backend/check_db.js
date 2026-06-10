const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.get("SELECT COUNT(*) as count FROM expenses", (err, row) => {
    console.log('--- 資料庫檢查結果 ---');
    if (err) {
      console.error('查詢失敗:', err.message);
    } else {
      console.log('總收支筆數:', row.count);
    }
  });

  db.all("SELECT * FROM categories", (err, rows) => {
    console.log('現有類別:', rows.map(r => r.name_zh).join(', '));
    db.close();
  });
});
