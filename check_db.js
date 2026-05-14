const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '零用金申請系統', 'backend', 'petty_cash.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('Error opening DB:', err.message); process.exit(1); }
    
    db.get("SELECT COUNT(*) as count FROM expenses", [], (err, row) => {
        if (err) { console.error('Error querying expenses:', err.message); }
        else { console.log('Expenses count:', row.count); }
        
        db.get("SELECT COUNT(*) as count FROM personnel", [], (err, row) => {
            if (err) { console.error('Error querying personnel:', err.message); }
            else { console.log('Personnel count:', row.count); }
            db.close();
        });
    });
});
