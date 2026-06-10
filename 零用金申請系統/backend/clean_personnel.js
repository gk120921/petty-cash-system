const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'petty_cash.db');
const db = new sqlite3.Database(dbPath);

async function cleanPersonnelOnly() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  db.serialize(() => {
    console.log('--- Starting Selective Personnel Reset ---');

    // 1. Ensure admin exists and get its ID
    db.run(
      "INSERT OR IGNORE INTO personnel (name, employee_id, password, role, status) VALUES (?, ?, ?, ?, ?)",
      ['System Admin', 'admin', hashedPassword, 'admin', 'ACTIVE'],
      function(err) {
        if (err) console.error('Error creating/verifying admin:', err.message);
        
        db.get("SELECT id FROM personnel WHERE employee_id = 'admin'", (err, adminRow) => {
          if (err || !adminRow) {
            console.error('Failed to get admin ID');
            return;
          }
          const adminId = adminRow.id;

          // 2. Update admin password and status
          db.run(
            "UPDATE personnel SET password = ?, status = 'ACTIVE', role = 'admin' WHERE id = ?",
            [hashedPassword, adminId]
          );

          // 3. Re-assign all expenses to admin (to preserve data)
          db.run("UPDATE expenses SET personnel_id = ?", [adminId], function(err) {
            if (err) console.error('Error re-assigning expenses:', err.message);
            else console.log(`Re-assigned ${this.changes} expense records to admin.`);
          });

          // 4. Delete all other personnel
          db.run("DELETE FROM personnel WHERE id != ?", [adminId], function(err) {
            if (err) console.error('Error deleting other personnel:', err.message);
            else console.log(`Deleted ${this.changes} personnel records. Only "admin" remains.`);
          });

          console.log('--- Selective Reset Complete ---');
          console.log('Login: admin / admin123');
        });
      }
    );
  });
}

cleanPersonnelOnly().then(() => {
  setTimeout(() => db.close(), 2000);
});
