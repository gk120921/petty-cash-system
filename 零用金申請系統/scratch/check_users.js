const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/database.sqlite');
db.all("SELECT id, name, employee_id, role FROM personnel", [], (err, rows) => {
  if (err) console.error(err);
  console.log('Current Personnel List:');
  console.table(rows);
  db.close();
});
