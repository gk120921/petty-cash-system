const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT id, invoice_date FROM expenses", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }

    rows.forEach(row => {
      let date = row.invoice_date;
      if (!date) return;

      // 檢查是否為 DD-MM-YYYY 格式 (e.g. 10-05-2026)
      const match = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (match) {
        const newDate = `${match[3]}-${match[2]}-${match[1]}`;
        console.log(`Fixing ID ${row.id}: ${date} -> ${newDate}`);
        db.run("UPDATE expenses SET invoice_date = ? WHERE id = ?", [newDate, row.id]);
      }
    });
  });
});

setTimeout(() => db.close(), 3000);
