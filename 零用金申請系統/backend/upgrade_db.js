const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

db.serialize(() => {
  console.log("Upgrading database schema...");
  
  // 1. 新增 type 欄位
  db.run("ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'EXPENSE'", (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("Column 'type' already exists.");
      } else {
        console.error("Error adding column:", err.message);
      }
    } else {
      console.log("Successfully added 'type' column.");
    }
  });

  // 2. 根據關鍵字修正類型
  db.run("UPDATE categories SET type = 'EXPENSE'", () => {
    db.run("UPDATE categories SET type = 'INCOME' WHERE name_zh LIKE '%撥補%' OR name_zh LIKE '%存入%'", (err) => {
      if (err) console.error("Error updating types:", err.message);
      else console.log("Category types corrected successfully based on keywords.");
    });
  });
});

db.close();
