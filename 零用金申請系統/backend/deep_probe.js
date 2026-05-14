const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

console.log("--- DEEP INVESTIGATION START ---");

db.serialize(() => {
  // 1. Check Schema
  db.all("PRAGMA table_info(categories)", (err, rows) => {
    console.log("1. Table Structure:", JSON.stringify(rows, null, 2));
  });

  // 2. Check Data for '個人代墊周轉'
  db.get("SELECT * FROM categories WHERE name_zh LIKE '%個人代墊%'", (err, row) => {
    console.log("2. Target Row Data:", JSON.stringify(row, null, 2));
  });

  // 3. Test a Direct Update
  console.log("3. Attempting a test update to INCOME...");
  db.run("UPDATE categories SET type = 'INCOME' WHERE name_zh LIKE '%個人代墊%'", function(err) {
    if (err) console.error("Update Error:", err.message);
    else {
      console.log("Update success! Rows changed:", this.changes);
      
      // 4. Verify the update stuck
      db.get("SELECT * FROM categories WHERE name_zh LIKE '%個人代墊%'", (err, row) => {
        console.log("4. Verification Data:", JSON.stringify(row, null, 2));
        db.close();
      });
    }
  });
});
