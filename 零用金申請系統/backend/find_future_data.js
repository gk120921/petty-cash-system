const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, invoice_date, detail_zh FROM expenses WHERE invoice_date LIKE '2026-10-%'", (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('--- Records found for 2026-10 ---');
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
