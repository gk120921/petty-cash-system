const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      rows.forEach(row => console.log(row.sql));
    }
  });
});

setTimeout(() => db.close(), 2000);
