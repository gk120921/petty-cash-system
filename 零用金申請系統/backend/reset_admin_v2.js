const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

async function resetAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin', salt);

  db.run("UPDATE personnel SET password = ?, role = 'admin' WHERE employee_id = 'admin'", [hashedPassword], function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Admin account reset successfully (Password is now hashed: admin). Rows affected: ${this.changes}`);
    }
    db.close();
  });
}

resetAdmin();
