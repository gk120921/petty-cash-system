const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../backend/petty_cash.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Starting migration for User Roles & Permissions...');

  // 1. Update personnel table schema
  db.run(`ALTER TABLE personnel ADD COLUMN employee_id TEXT`, (err) => {
    if (err) console.log('Column employee_id might already exist.');
  });
  db.run(`ALTER TABLE personnel ADD COLUMN password TEXT`, (err) => {
    if (err) console.log('Column password might already exist.');
  });
  db.run(`ALTER TABLE personnel ADD COLUMN role TEXT DEFAULT 'employee'`, (err) => {
    if (err) console.log('Column role might already exist.');
  });

  // 2. Set default values for existing personnel
  // We'll use their name as a temporary employee_id if not set
  db.all("SELECT id, name FROM personnel", [], (err, rows) => {
    if (err) return console.error(err);
    
    rows.forEach(person => {
      // Default: employee_id = name (sanitized), password = name (sanitized), role = employee
      const empId = person.name.split(' ')[0].toLowerCase() + person.id;
      const defaultRole = (person.name === '義昌(yichang)') ? 'admin' : 'employee';
      
      db.run(
        "UPDATE personnel SET employee_id = ?, password = ?, role = ? WHERE id = ?",
        [empId, empId, defaultRole, person.id]
      );
    });
    console.log('Migration complete. Default accounts created (User/Pass = Temp Employee ID).');
  });
});
