const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../backend/petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Resetting Admin Credentials...');

  // Ensure columns exist (just in case)
  db.run(`ALTER TABLE personnel ADD COLUMN employee_id TEXT`, (err) => {});
  db.run(`ALTER TABLE personnel ADD COLUMN password TEXT`, (err) => {});
  db.run(`ALTER TABLE personnel ADD COLUMN role TEXT DEFAULT 'employee'`, (err) => {});

  // Update the primary admin account
  // We look for '義昌(yichang)' or anyone who is currently an admin
  const sql = "UPDATE personnel SET employee_id = 'admin', password = 'admin123', role = 'admin' WHERE name = '義昌(yichang)' OR role = 'admin' OR id = 1";
  
  db.run(sql, [], function(err) {
    if (err) {
      console.error('Reset failed:', err.message);
    } else if (this.changes > 0) {
      console.log(`Success! Admin credentials reset to:`);
      console.log(`Account: admin`);
      console.log(`Password: admin123`);
    } else {
      // If no users exist, insert a new one
      db.run(
        "INSERT INTO personnel (name, employee_id, password, role) VALUES ('System Admin', 'admin', 'admin123', 'admin')",
        [],
        (err) => {
          if (err) console.error('Insert failed:', err.message);
          else console.log('Created new Admin account: admin / admin123');
        }
      );
    }
  });
});
