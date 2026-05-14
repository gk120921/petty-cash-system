const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

async function fix() {
  console.log('Starting Emergency Password Fix...');
  const hash = await bcrypt.hash('admin', 10);
  
  db.run("UPDATE personnel SET password = ? WHERE employee_id = 'admin'", [hash], function(err) {
    if (err) {
      console.error('Update failed:', err.message);
    } else {
      console.log('Update successful! Rows changed:', this.changes);
      
      // Verify immediately
      db.get("SELECT password FROM personnel WHERE employee_id = 'admin'", [], async (err, row) => {
        const match = await bcrypt.compare('admin', row.password);
        console.log('Verification check (password "admin"):', match ? 'PASSED ✅' : 'FAILED ❌');
        db.close();
      });
    }
  });
}

fix();
