const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('--- Checking Tables and Counts ---');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error(err);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('No tables found in database.');
      return;
    }

    tables.forEach(table => {
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
        if (err) {
          console.error(`Error counting ${table.name}:`, err.message);
        } else {
          console.log(`Table: ${table.name.padEnd(15)} | Count: ${row.count}`);
          if (row.count > 0) {
            db.all(`SELECT * FROM ${table.name} LIMIT 1`, (err, data) => {
              if (!err && data.length > 0) {
                console.log(`Sample data for ${table.name}:`, JSON.stringify(data[0]).substring(0, 100) + '...');
              }
            });
          }
        }
      });
    });
  });
});

setTimeout(() => db.close(), 3000);
