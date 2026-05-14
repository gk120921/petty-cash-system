const db = require('./database');

db.serialize(() => {
  console.log('Resetting Admin Credentials using internal DB module...');

  // Update the primary admin account
  const sql = "UPDATE personnel SET employee_id = 'admin', password = 'admin123', role = 'admin' WHERE name = '義昌(yichang)' OR role = 'admin' OR id = 1";
  
  db.run(sql, [], function(err) {
    if (err) {
      console.error('Reset failed:', err.message);
    } else if (this.changes > 0) {
      console.log(`Success! Admin credentials reset to:`);
      console.log(`Account: admin`);
      console.log(`Password: admin123`);
    } else {
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
