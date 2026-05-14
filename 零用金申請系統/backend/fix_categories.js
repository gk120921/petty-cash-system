const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

db.serialize(() => {
  console.log("Starting database correction...");
  
  // 1. 先將所有項目統一設為支出 (因為支出佔絕大多數)
  db.run("UPDATE categories SET type = 'EXPENSE'", (err) => {
    if (err) console.error("Error setting EXPENSE:", err.message);
    else console.log("Step 1: All categories initialized to EXPENSE.");
  });

  // 2. 將包含「撥補」或「存入」字眼的項目修正為收入
  db.run("UPDATE categories SET type = 'INCOME' WHERE name_zh LIKE '%撥補%' OR name_zh LIKE '%存入%'", (err) => {
    if (err) console.error("Error setting INCOME:", err.message);
    else console.log("Step 2: Income categories (撥補/存入) corrected successfully.");
  });
});

db.close((err) => {
  if (err) console.error(err.message);
  console.log("Database connection closed. Correction complete.");
});
