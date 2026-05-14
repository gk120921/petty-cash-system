const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

db.serialize(() => {
  // 1. 強制設定支出
  db.run("UPDATE categories SET type = 'EXPENSE'", (err) => {
    if (err) console.error(err);
    else console.log("All categories set to EXPENSE.");
  });

  // 2. 關鍵字設定收入
  db.run("UPDATE categories SET type = 'INCOME' WHERE name_zh LIKE '%撥補%' OR name_zh LIKE '%存入%'", (err) => {
    if (err) console.error(err);
    else {
      console.log("Income categories set to INCOME.");
      console.log("Database cleanup finished!");
    }
    db.close(); // 確保在最後一步才關閉
  });
});
