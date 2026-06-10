const db = require('../backend/database');

console.log('Testing database initialization...');

db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'", (err, row) => {
    if (err) {
      console.error('Error checking table:', err.message);
    } else {
      console.log('Table categories exists:', !!row);
    }
    
    db.all("PRAGMA table_info(categories)", (err, columns) => {
      if (err) {
        console.error('Error checking columns:', err.message);
      } else {
        console.log('Columns in categories:', columns.map(c => c.name).join(', '));
      }
      
      // Close DB after check
      db.close();
    });
  });
});
