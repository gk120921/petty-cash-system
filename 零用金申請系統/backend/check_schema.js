const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('petty_cash.db');

db.all("PRAGMA table_info(categories)", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Categories Table Schema:");
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
