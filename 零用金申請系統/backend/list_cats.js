const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

db.all("SELECT id, name_zh, type FROM categories", (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
  db.close();
});
