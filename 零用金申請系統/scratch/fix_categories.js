const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/database.sqlite');

const expenseKeywords = ['製造', '文具', '周轉', '運費', '郵電', '修繕', '廣告', '水電', '保險', '交際', '伙食', '福利', '交通'];

db.serialize(() => {
  // 1. 先將所有項目設為支出 (因為大部分都是支出)
  db.run("UPDATE categories SET type = 'EXPENSE'", (err) => {
    if (err) console.error(err);
    else console.log("Set all categories to EXPENSE initially.");
  });

  // 2. 將包含「撥補」或「存入」的項目設為收入
  db.run("UPDATE categories SET type = 'INCOME' WHERE name_zh LIKE '%撥補%' OR name_zh LIKE '%存入%'", (err) => {
    if (err) console.error(err);
    else console.log("Updated income categories successfully.");
  });
});

db.close();
